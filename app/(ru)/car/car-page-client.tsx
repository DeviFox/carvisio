"use client";

import {useEffect, useRef, useState} from "react";
import {useSearchParams, useRouter} from "next/navigation";
import styles from "./page.module.css";
import shellStyles from "@/app/page.module.css";
import CarIllustration from "@/components/car-illustration";
import AppBar, { VersionTag } from "@/components/app-bar";
import AccountControl from "@/components/account-control";
import ThemeToggle from "@/components/theme-toggle";
import IntroCard from "@/components/intro-card";
import AttentionList from "@/components/attention-list";
import ComponentPanel from "@/components/component-panel";
import EventDialog from "@/components/event-dialog";
import RecentWork from "@/components/recent-work";
import SystemList, {type ComponentRow, type SystemGroup} from "@/components/system-list";
import SystemSheet from "@/components/system-sheet";
import UpdateMileageDialog from "@/components/update-mileage-dialog";
import AddEventDialog from "@/components/add-event-dialog";
import AddCarDialog from "@/components/add-car-dialog";
import ReportPanel from "@/components/report-panel";
import {
	ArrowLeftIcon,
	HelpIcon,
	PlusIcon,
	PencilIcon,
	ExportIcon,
} from "@/components/icons";
import {api, ApiError, type GarageSnapshot} from "@/lib/api";
import {useAuth} from "@/lib/auth";
import {useGarage} from "@/lib/store";
import {useT} from "@/lib/i18n/react";
import {useHydrated} from "@/lib/use-hydrated";
import {
	componentStatus,
	computeResource,
	formatAgo,
	findActiveInstalledPart,
	latestInspectionFor,
	rollupStatus,
	sortComponentsByName,
	sortEventsByDateDesc,
	bodyTypeLabel,
	fuelLabel,
	type StatusLabel,
} from "@/lib/compute";
import type {MaintenanceEvent, MaintenanceType, SystemCategory} from "@/lib/types";

export default function CarPageClient() {
	const searchParams = useSearchParams();
	const id = searchParams.get("id") ?? "";
	return <CarPage key={id} id={id} initialReportOpen={searchParams.get("view") === "report"}/>;
}

function CarPage({id, initialReportOpen}: {id: string; initialReportOpen: boolean}) {
	const router                        = useRouter();
	const hydrated                      = useHydrated();
	const t                             = useT();
	// Captured once per visit: "mileage is stale" needs no live clock.
	const [now]                         = useState(() => Date.now());
	const [mileageOpen, setMileageOpen] = useState(false);
	// null — closed; systemId — open with a new component in that system.
	const [record, setRecord]           = useState<{
		systemId?: string;
		componentId?: string;
		type?: MaintenanceType;
		template?: MaintenanceEvent;
		// A recorded event whose type or component is being changed.
		replacing?: MaintenanceEvent;
	} | null>(null);
	const [openComponentId, setOpenComponentId] = useState<string | null>(null);
	// Phones: the system opened from the car, shown in a sheet under it.
	const [sheetSystemId, setSheetSystemId]     = useState<string | null>(null);
	const [editEventId, setEditEventId]         = useState<string | null>(null);
	const [editOpen, setEditOpen]       = useState(false);
	// The report takes the ledger's place. Local state answers at once (a
	// zone click closes it and scrolls in the same frame); the address mirrors
	// it, so the browser's Back closes the report and a reload keeps it.
	const [reportOpen, setReportOpen]   = useState(initialReportOpen);
	const reportPushed                  = useRef(false);
	const [helpOpen, setHelpOpen]       = useState(false);
	// Set while a delete navigates away, so the page doesn't flash "не найден".
	const [leaving, setLeaving]         = useState(false);
	// Hovering or focusing a system row lights up its zone on the sticky car.
	const [hoveredSystem, setHoveredSystem] = useState<SystemCategory | null>(null);
	const [expanded, setExpanded]           = useState<Set<string>>(() => new Set());
	const [expandedFor, setExpandedFor]     = useState<string | null>(null);
	const [flashId, setFlashId]             = useState<string | null>(null);

	const ownedVehicle     = useGarage((s) => s.vehicles.find((v) => v.id === id));
	const ownedSystems     = useGarage((s) => s.systems);
	const ownedComponents  = useGarage((s) => s.components);
	const ownedParts       = useGarage((s) => s.installedParts);
	const ownedInspections = useGarage((s) => s.inspections);
	const ownedEvents      = useGarage((s) => s.events);
	const ownedMileage     = useGarage((s) => s.mileageHistory);
	const setLastViewed    = useGarage((s) => s.setLastViewedVehicle);
	const deleteVehicle    = useGarage((s) => s.deleteVehicle);
	const authStatus       = useAuth((s) => s.status);
	const viewerId         = useAuth((s) => s.user?.id);
	const [attempt, setAttempt] = useState(0);
	const [lookup, setLookup] = useState<{
		viewerId: string;
		attempt: number;
		garage?: GarageSnapshot;
		failed?: boolean;
	} | null>(null);
	const result = lookup?.viewerId === viewerId && lookup?.attempt === attempt ? lookup : null;
	// Keep admin views out of the garage store, local storage and sync outbox.
	const remote = ownedVehicle ? undefined : result?.garage;
	const vehicle = ownedVehicle ?? remote?.vehicles[0];
	const systems = remote?.systems ?? ownedSystems;
	const components = remote?.components ?? ownedComponents;
	const installedParts = remote?.installedParts ?? ownedParts;
	const inspections = remote?.inspections ?? ownedInspections;
	const events = remote?.events ?? ownedEvents;
	const mileageHistory = remote?.mileageHistory ?? ownedMileage;
	const vehicleId = vehicle?.id;
	const ownedVehicleId = ownedVehicle?.id;
	const vanished = hydrated && !vehicle && id !== "" && expandedFor === id;
	const canLookUp = hydrated && !ownedVehicle && !vanished && !!viewerId && id !== "";

	useEffect(() => {
		if (!canLookUp || !viewerId) return;
		let active = true;
		void api.otherVehicle(id).then(
			(garage) => {
				if (active) setLookup({viewerId, attempt, garage});
			},
			(err: unknown) => {
				if (!active) return;
				const unavailable = err instanceof ApiError && (err.status === 401 || err.status === 404);
				setLookup({viewerId, attempt, failed: !unavailable});
			},
		);
		return () => { active = false; };
	}, [attempt, canLookUp, id, viewerId]);

	useEffect(() => {
		const onPop = () => {
			reportPushed.current = false;
			setReportOpen(new URLSearchParams(window.location.search).get("view") === "report");
		};
		window.addEventListener("popstate", onPop);
		return () => window.removeEventListener("popstate", onPop);
	}, []);

	useEffect(() => {
		if (ownedVehicleId) setLastViewed(ownedVehicleId);
	}, [ownedVehicleId, setLastViewed]);

	// Open systems are a per-viewer convenience, remembered per car: read
	// them again whenever the page switches to another car.
	if (hydrated && vehicleId && vehicleId !== expandedFor) {
		setExpandedFor(vehicleId);
		setExpanded(remote ? new Set() : readOpen(vehicleId));
	}

	// The car was on screen and is gone: signed out (the account's garage
	// leaves the browser), session expired, or deleted on another device.
	// That's not a bad link, so go to the garage instead of "не найден".
	// expandedFor is set the first time this car is shown.
	useEffect(() => {
		if (vanished) router.replace("/");
	}, [vanished, router]);

	const waiting = !vehicle && id !== "" && (authStatus === "unknown" || (canLookUp && !result));
	if (!hydrated || leaving || vanished || waiting) {
		return <div className={shellStyles.shell} aria-busy="true"/>;
	}

	if (!vehicle) {
		return (
			<div className={shellStyles.shell}>
				{/* Same chrome as every other page, so the dead end still has the way home. */}
				<header className={shellStyles.topBar}>
					<button
						type="button"
						className={styles.backBtn}
						onClick={() => router.push("/")}
						aria-label={t.garage.toGarage}
					>
						<ArrowLeftIcon/>
					</button>
					<div className={shellStyles.topActions}>
						<ThemeToggle/>
						<AccountControl compact/>
					</div>
				</header>
				<AppBar home/>
				<main className={shellStyles.main}>
					<div className={styles.notFound}>
						<h1 className={shellStyles.h1}>{result?.failed ? t.car.loadFailed : t.car.notFound}</h1>
						{!result?.failed && <p className={shellStyles.sub}>{t.car.notFoundHint}</p>}
						<button
							type="button"
							className={`${shellStyles.primaryBtn} ${styles.notFoundBtn}`}
							onClick={() => result?.failed ? setAttempt(attempt + 1) : router.push("/")}
						>
							{!result?.failed && <ArrowLeftIcon/>}
							{result?.failed ? t.car.retry : t.garage.toGarage}
						</button>
					</div>
				</main>
			</div>
		);
	}

	const vehicleSystems = systems
		.filter((s) => s.vehicleId === vehicle.id && !s.isArchived)
		.sort((a, b) => a.sortOrder - b.sortOrder);

	// Latest reading; the car's own creation counts as the first one.
	const mileageAt = mileageHistory
		.filter((m) => m.vehicleId === vehicle.id)
		.reduce<string>((latest, m) => (m.date > latest ? m.date : latest), vehicle.createdAt);
	const mileageStale = now - new Date(mileageAt).getTime() > 30 * 24 * 60 * 60 * 1000;

	const vehicleEvents = sortEventsByDateDesc(
		events.filter((e) => e.vehicleId === vehicle.id),
	);

	const groups: SystemGroup[] = vehicleSystems.map((system) => {
		const rows = sortComponentsByName(
			components.filter(
				(c) => c.vehicleId === vehicle.id && c.systemId === system.id && !c.isArchived,
			),
		).map((component): ComponentRow => {
			const part     = findActiveInstalledPart(component.id, installedParts);
			const resource = computeResource(part, vehicle);
			const status   = componentStatus(resource, latestInspectionFor(component.id, inspections));
			return {component, system, part, resource, status};
		});
		return {system, rows, label: rollupStatus(rows.map((r) => r.status.label))};
	});

	const severity  = {critical: 0, attention: 1, ok: 2, unknown: 3} as const;
	const attention = groups
		.flatMap((g) => g.rows)
		.filter((r) => r.status.label === "attention" || r.status.label === "critical")
		.sort(
			(a, b) =>
				severity[a.status.label] - severity[b.status.label] ||
				ratioOf(a) - ratioOf(b),
		);
	const hasComponents = groups.some((g) => g.rows.length > 0);
	const flagged       = groups
		.filter((g) => g.label === "critical" || g.label === "attention")
		.sort((a, b) => severity[a.label] - severity[b.label]);
	const editEvent     = vehicleEvents.find((e) => e.id === editEventId);
	const openRow       = groups.flatMap((g) => g.rows).find((r) => r.component.id === openComponentId);
	const sheetGroup    = groups.find((g) => g.system.id === sheetSystemId);

	const zoneStates: Partial<Record<string, StatusLabel>> = {};
	for (const g of groups) zoneStates[g.system.category] = g.label;
	const availableZones = vehicleSystems.map((s) => s.category);

	function persistOpen(next: Set<string>) {
		if (remote) return;
		try {
			localStorage.setItem(openKey(vehicle!.id), JSON.stringify([...next]));
		} catch {
			// Storage can be unavailable; the open state just won't survive a reload.
		}
	}

	function toggleSystem(systemId: string) {
		setExpanded((prev) => {
			const next = new Set(prev);
			if (next.has(systemId)) next.delete(systemId);
			else next.add(systemId);
			persistOpen(next);
			return next;
		});
	}

	// Opens the system, scrolls to the target row and marks it briefly.
	function reveal(systemId: string, componentId?: string) {
		setExpanded((prev) => {
			if (prev.has(systemId)) return prev;
			const next = new Set(prev).add(systemId);
			persistOpen(next);
			return next;
		});
		const target = componentId ?? systemId;
		setFlashId(target);
		requestAnimationFrame(() => {
			const el     = document.getElementById(componentId ? `component-${componentId}` : `system-${systemId}`);
			const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
			el?.scrollIntoView({behavior: reduce ? "auto" : "smooth", block: componentId ? "center" : "start"});
		});
		window.setTimeout(() => setFlashId((f) => (f === target ? null : f)), 1400);
	}

	// Phones and touch screens: the car is not sticky and there is no hover.
	function carScrollsAway() {
		return window.matchMedia("(max-width: 820px), (hover: none)").matches;
	}

	function focusSystem(category: string) {
		const sys = vehicleSystems.find((s) => s.category === category);
		if (!sys) return;
		if (reportOpen) closeReport();
		// No hover and no sticky car (phones, touch screens): scrolling to the
		// ledger takes the car off screen and nothing says what was tapped. The
		// system opens in a sheet instead, under the car with its zone lit.
		if (carScrollsAway()) {
			const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
			document.getElementById("car-stage")?.scrollIntoView({behavior: reduce ? "auto" : "smooth", block: "start"});
			setSheetSystemId(sys.id);
			return;
		}
		reveal(sys.id);
	}

	function reportUrl(open: boolean) {
		const url = new URL(window.location.href);
		if (open) url.searchParams.set("view", "report");
		else url.searchParams.delete("view");
		return url;
	}

	function openReport() {
		setReportOpen(true);
		window.history.pushState(window.history.state, "", reportUrl(true));
		reportPushed.current = true;
		// Bring the top of the report into view if the page was scrolled past it.
		requestAnimationFrame(() => {
			const el = document.getElementById("car-ledger");
			if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({block: "start"});
		});
	}

	// Our own entry: step back over it. Opened by link: just drop the flag.
	function closeReport() {
		setReportOpen(false);
		if (reportPushed.current) {
			reportPushed.current = false;
			window.history.back();
		} else {
			window.history.replaceState(window.history.state, "", reportUrl(false));
		}
	}

	return (
		<>
			<div className={shellStyles.shell}>
				{/* Same tools as the garage's top bar, with the way back in place of the brand. */}
				<header className={shellStyles.topBar}>
					<button
						type="button"
						className={styles.backBtn}
						onClick={() => router.push("/")}
						aria-label={t.garage.toGarage}
					>
						<ArrowLeftIcon/>
					</button>
					<div className={shellStyles.topActions}>
						<button type="button" className={shellStyles.toolBtn} onClick={() => setHelpOpen(true)} aria-label={t.garage.howItWorks}>
							<HelpIcon/>
						</button>
						<ThemeToggle/>
						<AccountControl compact/>
					</div>
				</header>

				<AppBar home onHelp={() => setHelpOpen(true)}/>

				<main className={styles.main}>
					<header className={styles.heroHead}>
						<div>
							{/* The edit button sits beside the heading, not in it, so
							    the heading's accessible name is just the car. */}
							<div className={styles.carTitle}>
								<h1 className={styles.carName}>{vehicle.name}</h1>
								{!remote && (
									<button
										type="button"
										className={styles.editBtn}
										onClick={() => setEditOpen(true)}
										aria-label={t.car.editCar}
										title={t.car.editCarShort}
									>
										<PencilIcon/>
									</button>
								)}
								<button
									type="button"
									className={styles.editBtn}
									onClick={() => (reportOpen ? closeReport() : openReport())}
									aria-label={t.car.report}
									aria-pressed={reportOpen}
									title={t.car.report}
								>
									<ExportIcon/>
								</button>
							</div>
							<p className={styles.carMeta}>
								{[
									vehicle.year,
									fuelLabel(vehicle.fuelType),
									vehicle.engine,
									bodyTypeLabel(vehicle.bodyType),
								]
									.filter(Boolean)
									.join(" · ") || "—"}
							</p>
							{remote && <p className={styles.carMeta}>{t.car.adminView}</p>}
							{vehicle.vin ? (
								<p className={styles.carVin}>
									<span className={styles.carVinLabel}>{t.car.vin}</span>
									<span className="mono">{vehicle.vin}</span>
								</p>
							) : null}
						</div>
						{!remote && (
							<button
								type="button"
								className={`${shellStyles.primaryBtn} ${styles.headCta} ${reportOpen ? styles.ctaHidden : ""}`}
								onClick={() => setRecord({})}
							>
								<PlusIcon/>
								{t.car.addRecord}
							</button>
						)}
					</header>

					<div className={`${styles.layout} ${reportOpen ? styles.reporting : ""}`}>
						<aside className={styles.stage} id="car-stage" aria-label={t.car.carState}>
							<div className={styles.carCol}>
								<div className={styles.illustration}>
									<CarIllustration
										bodyType={vehicle.bodyType}
										availableZones={availableZones as never}
										zoneStates={zoneStates as never}
										activeZone={sheetGroup?.system.category ?? hoveredSystem}
										onZoneClick={focusSystem}
									/>
								</div>
								{flagged.length > 0 ? (
									// Names the dots on the car, and carries "Прочее", which has no zone.
									<ul className={styles.zoneChips} aria-label={t.car.flaggedSystems}>
										{flagged.map((g) => (
											<li key={g.system.id}>
												<button
													type="button"
													className={styles.zoneChip}
													onClick={() => focusSystem(g.system.category)}
													onMouseEnter={() => setHoveredSystem(g.system.category)}
													onMouseLeave={() => setHoveredSystem(null)}
													onFocus={() => setHoveredSystem(g.system.category)}
													onBlur={() => setHoveredSystem(null)}
												>
													<span className={`${styles.zoneDot} ${styles[`zd-${g.label}`]}`} aria-hidden="true"/>
													{g.system.name}
												</button>
											</li>
										))}
									</ul>
								) : null}
							</div>
							<div className={styles.stageSide}>
								<div className={styles.mileage}>
									<div>
										<div className={styles.mileageLabel}>{t.car.currentMileage}</div>
										{vehicle.currentMileageKm !== undefined ? (
											<div className={`${styles.mileageValue} numeric mono`}>
												{digitGroups(vehicle.currentMileageKm)}
												<span className={styles.mileageUnit}>{t.common.kmUnit}</span>
											</div>
										) : (
											<div className={styles.mileageMissing}>{t.car.mileageNotSet}</div>
										)}
										{vehicle.currentMileageKm === undefined ? (
											<div className={styles.mileageAge}>{t.car.mileageNeeded}</div>
										) : mileageAt ? (
											// Every forecast is measured from this number, so say how fresh it is.
											<div className={`${styles.mileageAge} ${mileageStale ? styles.mileageStale : ""}`}>
												{t.car.mileageUpdated(formatAgo(mileageAt))}
											</div>
										) : null}
									</div>
									{!remote && (
										<button
											type="button"
											className={styles.ghostAction}
											onClick={() => setMileageOpen(true)}
										>
											{vehicle.currentMileageKm === undefined ? t.car.setMileage : t.car.updateMileage}
										</button>
									)}
								</div>
								{hasComponents ? (
									<AttentionList
										rows={attention}
										// On a phone the part's own sheet, rather than a jump down the page.
										onSelect={(row) => (carScrollsAway() ? setOpenComponentId(row.component.id) : reveal(row.system.id, row.component.id))}
									/>
								) : null}
							</div>
						</aside>

						<div className={styles.ledger} id="car-ledger">
							{reportOpen ? (
								<ReportPanel
									vehicle={vehicle}
									onClose={closeReport}
									data={{systems, components, installedParts, inspections, events}}
								/>
							) : (
							<section className={styles.systems} aria-label={t.car.carSystems}>
								{groups.length === 0 ? (
									<div className={styles.emptyNote}>{t.car.noSystems}</div>
								) : (
									<SystemList
										groups={groups}
										expanded={expanded}
										flashId={flashId}
										onToggle={toggleSystem}
										onHover={setHoveredSystem}
										onAddComponent={remote ? undefined : (systemId) => setRecord({systemId})}
										onOpenComponent={setOpenComponentId}
									/>
								)}
							</section>
							)}
						</div>

						{/* Its own grid cell: under the systems up to 1599px, a third
						    column on wide screens instead of below a long ledger. */}
						{reportOpen ? null : (
							<div className={styles.history}>
								<RecentWork
									events={vehicleEvents}
									components={components}
									onOpen={(e) => setEditEventId(e.id)}
								/>
							</div>
						)}
					</div>
				</main>
				<VersionTag/>
				{!remote && <div className={styles.ctaSpacer} aria-hidden="true"/>}
			</div>

			{helpOpen ? <IntroCard onClose={() => setHelpOpen(false)}/> : null}
			{!remote && (
				<UpdateMileageDialog
					open={mileageOpen}
					onClose={() => setMileageOpen(false)}
					vehicle={vehicle}
				/>
			)}
			{sheetGroup ? (
				<SystemSheet
					group={sheetGroup}
					onClose={() => setSheetSystemId(null)}
					onOpenComponent={setOpenComponentId}
					onAddComponent={remote ? undefined : (systemId) => setRecord({systemId})}
				/>
			) : null}
			{/* Stays open under its dialogs, so the history is there to check against. */}
			{openRow ? (
				<ComponentPanel
					row={openRow}
					vehicle={vehicle}
					events={vehicleEvents}
					inspection={latestInspectionFor(openRow.component.id, inspections)}
					onClose={() => setOpenComponentId(null)}
					onAddRecord={remote ? undefined : (type, template) => setRecord({componentId: openRow.component.id, type, template})}
					onOpenEvent={(e) => setEditEventId(e.id)}
				/>
			) : null}
			{!remote && record ? (
				<AddEventDialog
					open
					onClose={() => setRecord(null)}
					vehicle={vehicle}
					defaultSystemId={record.systemId}
					defaultComponentId={record.componentId}
					defaultType={record.type}
					template={record.template}
					replacing={record.replacing}
				/>
			) : null}
			{editEvent ? (
				<EventDialog
					event={editEvent}
					components={components}
					readOnly={!!remote}
					onClose={() => setEditEventId(null)}
					onChangeKind={remote ? undefined : (draft) => {
						setEditEventId(null);
						// Next frame: once this dialog has left the modal stack, the
						// form opens as a top-level dialog, not one stacked over it.
						requestAnimationFrame(() => setRecord({replacing: draft}));
					}}
				/>
			) : null}
			{!remote && (
				<AddCarDialog
					open={editOpen}
					onClose={() => setEditOpen(false)}
					editVehicle={vehicle}
					onDelete={() => {
						setLeaving(true);
						setEditOpen(false);
						deleteVehicle(vehicle.id);
						router.replace("/");
					}}
				/>
			)}
		</>
	);
}

// Display-size mono makes the locale's no-break space read as a word gap;
// render digit groups with a narrow optical gap instead.
function digitGroups(n: number) {
	return n
		.toLocaleString("ru-RU")
		.split(/\s/)
		.map((group, i) => (
			<span key={i} className={i > 0 ? styles.digitGroup : undefined}>{group}</span>
		));
}

const openKey = (vehicleId: string) => `carvisio.car.${vehicleId}.open`;

function readOpen(vehicleId: string): Set<string> {
	try {
		const raw = localStorage.getItem(openKey(vehicleId));
		return new Set(raw ? (JSON.parse(raw) as string[]) : []);
	} catch {
		return new Set();
	}
}

function ratioOf(row: ComponentRow): number {
	return row.resource.kind === "known" ? row.resource.ratio : 1;
}
