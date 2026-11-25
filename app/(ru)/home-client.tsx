"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/page.module.css";
import AddCarDialog from "@/components/add-car-dialog";
import AppBar, { VersionTag } from "@/components/app-bar";
import AccountControl from "@/components/account-control";
import ThemeToggle from "@/components/theme-toggle";
import AuthNotice from "@/components/auth-notice";
import IntroCard, { introDismissed } from "@/components/intro-card";
import { HelpIcon, PlusIcon } from "@/components/icons";
import { useGarage } from "@/lib/store";
import { useSync } from "@/lib/sync";
import { useHydrated } from "@/lib/use-hydrated";
import { formatKm, fuelLabel, vehicleHealth } from "@/lib/compute";
import { useT } from "@/lib/i18n/react";
import { tr } from "@/lib/i18n";
import { SEED_SYSTEMS } from "@/lib/types";
import StatusPill from "@/components/status-pill";
import { systemStatusWord } from "@/components/system-list";

export default function HomeClient() {
  const router = useRouter();
  const t = useT();
  const [open, setOpen] = useState(false);
  const hydrated = useHydrated();
  // The story about how carvisio works, until the owner dismisses it.
  const [showIntro, setShowIntro] = useState(false);
  // Opened by itself (not from "?"): on close, focus goes to the next step, adding a car.
  const introAuto = useRef(false);
  const addSlotRef = useRef<HTMLButtonElement>(null);

  const vehicles = useGarage((s) => s.vehicles);
  const components = useGarage((s) => s.components);
  const installedParts = useGarage((s) => s.installedParts);
  const inspections = useGarage((s) => s.inspections);
  const inAccount = useGarage((s) => s.ownerId !== null);
  const offline = useSync((s) => s.offline);
  const refused = useSync((s) => s.refused);

  useEffect(() => {
    // Opens by itself once, for someone arriving to an empty garage.
    const auto = !introDismissed() && useGarage.getState().vehicles.length === 0;
    introAuto.current = auto;
    // Mount-only read of browser state (localStorage, the URL), which the
    // static server render can't see; it can't be a useState initializer
    // without a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowIntro(auto);
    const params = new URLSearchParams(window.location.search);
    if (params.get("dialog") === "add") setOpen(true);
    const seedBody = params.get("seed-body");
    if (seedBody) {
      const g = useGarage.getState();
      g.reset();
      const v = g.addVehicle({
        name: `Demo ${seedBody}`,
        make: "Demo",
        model: seedBody,
        year: 2020,
        bodyType: seedBody as never,
        currentMileageKm: 50000,
        units: "km",
      });
      const names = tr().common.systemName;
      for (const category of SEED_SYSTEMS) g.addSystem({ vehicleId: v.id, name: names[category], category });
      router.replace(`/car?id=${encodeURIComponent(v.id)}`);
      return;
    }
    if (params.get("seed") === "demo") {
      const g = useGarage.getState();
      if (g.vehicles.length === 0) {
        const v = g.addVehicle({
          name: "Toyota Corolla",
          make: "Toyota",
          model: "Corolla",
          year: 2009,
          fuelType: "gasoline",
          engine: "1.5 1NZ-FE",
          bodyType: "wagon",
          currentMileageKm: 178430,
          units: "km",
        });
        const sys = g.addSystem({
          vehicleId: v.id,
          name: tr().common.systemName.engine,
          category: "engine",
        });
        const comp = g.addComponent({
          vehicleId: v.id,
          systemId: sys.id,
          name: tr().garage.demo.oil,
          kind: "consumable",
        });
        // A believable first look: the oil was changed five months and
        // 8 500 km ago, so the demo opens on "Скоро замена", not a crisis.
        const changed = new Date();
        changed.setMonth(changed.getMonth() - 5);
        const changedOn = changed.toISOString().slice(0, 10);
        const part = g.addInstalledPart({
          componentId: comp.id,
          installedAtMileageKm: 169930,
          installedAtDate: changedOn,
          expectedLifeKm: 10000,
          notes: tr().garage.demo.note,
        });
        g.addEvent({
          vehicleId: v.id,
          type: "replacement",
          date: changedOn,
          mileageKm: 169930,
          componentIds: [comp.id],
          installedPartId: part.id,
          costMinorUnits: 650000,
          currency: "RUB",
          notes: tr().garage.demo.note,
        });
        router.replace(`/car?id=${encodeURIComponent(v.id)}`);
      }
    }
  }, [router]);


  return (
    <>
      <div className={styles.shell}>
        <header className={styles.topBar}>
          <div className={styles.topBrand}>
            <div className={styles.brandMark} aria-hidden="true">c</div>
            <div className={styles.brandName}>carvisio</div>
          </div>
          <div className={styles.topActions}>
            <button type="button" className={styles.toolBtn} onClick={() => setShowIntro(true)} aria-label={t.garage.howItWorks}>
              <HelpIcon />
            </button>
            <ThemeToggle />
            <AccountControl compact />
          </div>
        </header>
        <AppBar onHelp={() => setShowIntro(true)} />

        <main className={styles.main}>
          <header className={styles.header}>
            <div>
              <h1 className={styles.h1}>{t.garage.title}</h1>
              <AuthNotice />
            </div>
          </header>


          <section aria-labelledby="garage-grid-label">
            <h2 id="garage-grid-label" className="sr-only">
              {t.garage.carsInGarage}
            </h2>
            <div className={styles.grid}>
              {hydrated ? (
                vehicles.length === 0 ? (
                  <button
                    type="button"
                    ref={addSlotRef}
                    className={styles.emptySlot}
                    onClick={() => setOpen(true)}
                    aria-label={t.garage.addFirstCar}
                  >
                    <div className={styles.emptyIcon} aria-hidden="true">
                      <PlusIcon />
                    </div>
                    <div className={styles.emptyTitle}>{t.garage.addCar}</div>
                    <div className={styles.emptyDesc}>
                      {t.garage.emptyDesc}
                    </div>
                  </button>
                ) : (
                  <>
                    {vehicles.map((v) => {
                      const health = vehicleHealth(v, components, installedParts, inspections);
                      return (
                        <button
                          key={v.id}
                          type="button"
                          className={styles.carCard}
                          onClick={() => router.push(`/car?id=${encodeURIComponent(v.id)}`)}
                        >
                          <div className={styles.carCardMain}>
                            <div className={styles.carName}>{v.name}</div>
                            <div className={styles.carMeta}>
                              {[v.year, v.fuelType && fuelLabel(v.fuelType), v.engine]
                                .filter(Boolean)
                                .join(" · ") || "—"}
                            </div>
                            {v.currentMileageKm !== undefined ? (
                              <div className={`${styles.carMileage} numeric mono`}>{formatKm(v.currentMileageKm)}</div>
                            ) : (
                              <div className={styles.carMileageMissing}>{t.garage.mileageMissing}</div>
                            )}
                          </div>
                          {/* The car's state, not its bookkeeping: worst status, then what it is about. */}
                          <div className={styles.carCardFooter}>
                            <StatusPill label={health.label} text={health.text ?? systemStatusWord(health.label)} size="sm" />
                            <span className={styles.carHealth}>
                              {health.flagged.length > 0
                                ? health.flagged.join(", ")
                                : health.known > 0
                                  ? t.garage.tracking(health.known)
                                  : health.total > 0
                                    ? t.garage.noLifeSet
                                    : t.garage.addFirstReplacement}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      ref={addSlotRef}
                      className={`${styles.emptySlot} ${styles.emptySlotMore}`}
                      onClick={() => setOpen(true)}
                      aria-label={t.garage.addAnotherCar}
                    >
                      <div className={styles.emptyIcon} aria-hidden="true">
                        <PlusIcon />
                      </div>
                      <div className={styles.emptyTitle}>{t.garage.addCar}</div>
                    </button>
                  </>
                )
              ) : (
                <div className={styles.ghostLoad} aria-hidden="true" />
              )}
            </div>
          </section>

          <div className={styles.statusLine}>
            <span className={styles.statusDot} aria-hidden="true" />
            <strong>{hydrated ? vehicles.length : 0}</strong>
            {t.garage.cars(vehicles.length)}
            <span className={styles.sep}>·</span>
            <span className={styles.statusNote}>
              {!hydrated || !inAccount
                ? t.garage.storedLocally
                : refused > 0
                  ? t.garage.refused
                  : offline
                  ? t.garage.offline
                  : t.garage.synced}
            </span>
          </div>
        </main>
        <VersionTag />
      </div>

      {showIntro ? (
        <IntroCard
          onClose={() => {
            setShowIntro(false);
            if (introAuto.current) requestAnimationFrame(() => addSlotRef.current?.focus());
            introAuto.current = false;
          }}
        />
      ) : null}

      <AddCarDialog
        open={open}
        onClose={() => setOpen(false)}
        onSaved={(id) => router.push(`/car?id=${encodeURIComponent(id)}`)}
      />
    </>
  );
}
