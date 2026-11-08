package recognize

import (
	"errors"
	"fmt"
	"slices"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"
)

// Limits on the context the client sends along with the file.
const (
	maxComponents = 300
	maxNameLen    = 200
	maxIDLen      = 64
	maxItems      = 100
	maxTitleLen   = 300
	maxShopLen    = 200
	maxWarnings   = 20
	maxMileageKm  = 5_000_000
	maxMinorUnits = 1_000_000_000_00 // a billion in major units
)

// Enums shared with lib/types.ts.
var (
	categories = []string{"engine", "transmission", "brakes", "suspension", "tires",
		"electrical", "cooling", "body", "other"}
	eventTypes = []string{"replacement", "purchase", "fluid_service", "repair", "inspection"}
	docKinds   = []string{"fiscal_receipt", "work_order", "handwritten", "other"}
	lineKinds  = []string{"part", "fluid", "labor", "other"}
	axles      = []string{"front", "rear"}
	sides      = []string{"left", "right"}
	// Only these systems take an axle or side (POSITIONED_CATEGORIES in lib/types.ts).
	positioned = []string{"suspension", "brakes", "tires"}
)

// noComponent is the enum value the model picks when no listed component fits.
const noComponent = "none"

// Request context: the vehicle's components as the browser has them. They
// come from the client because a component created offline may not have
// reached the server yet.
type Context struct {
	Components []ContextComponent `json:"components"`
}

type ContextComponent struct {
	ID       string  `json:"id"`
	Name     string  `json:"name"`
	Category string  `json:"category"`
	Axle     *string `json:"axle,omitempty"`
	Side     *string `json:"side,omitempty"`
}

func (c *Context) Validate() error {
	if len(c.Components) > maxComponents {
		return fmt.Errorf("context.components: too many (max %d)", maxComponents)
	}
	seen := make(map[string]bool, len(c.Components))
	for i, x := range c.Components {
		switch {
		case x.ID == "" || len(x.ID) > maxIDLen:
			return fmt.Errorf("context.components[%d].id: invalid", i)
		case seen[x.ID]:
			return fmt.Errorf("context.components[%d].id: duplicate", i)
		case x.Name == "" || utf8.RuneCountInString(x.Name) > maxNameLen:
			return fmt.Errorf("context.components[%d].name: empty or too long", i)
		case !slices.Contains(categories, x.Category):
			return fmt.Errorf("context.components[%d].category: unknown value", i)
		}
		seen[x.ID] = true
	}
	return nil
}

// label is how the model refers to component i: short and impossible to
// mistype, unlike a UUID.
func label(i int) string { return "c" + strconv.Itoa(i+1) }

// modelOutput is what Gemini returns, shaped by responseSchema below.
type modelOutput struct {
	Document struct {
		Kind      string  `json:"kind"`
		Date      *string `json:"date"`
		MileageKm *int64  `json:"mileageKm"`
		Currency  *string `json:"currency"`
		Total     *string `json:"total"`
		Shop      *string `json:"shop"`
	} `json:"document"`
	Items []struct {
		Title             string  `json:"title"`
		LineKind          string  `json:"lineKind"`
		Cost              *string `json:"cost"`
		Component         string  `json:"component"`
		SuggestedName     *string `json:"suggestedName"`
		SuggestedCategory *string `json:"suggestedCategory"`
		SuggestedAxle     *string `json:"suggestedAxle"`
		SuggestedSide     *string `json:"suggestedSide"`
		EventType         string  `json:"eventType"`
		Uncertain         bool    `json:"uncertain"`
	} `json:"items"`
	Warnings []string `json:"warnings"`
}

// Result is the draft the client shows for review. Nothing is saved: the
// owner edits it and the browser creates the records itself.
type Result struct {
	Document Document `json:"document"`
	Items    []Item   `json:"items"`
	Warnings []string `json:"warnings"`
}

type Document struct {
	Kind            string  `json:"kind"`
	Date            *string `json:"date,omitempty"`
	MileageKm       *int64  `json:"mileageKm,omitempty"`
	Currency        *string `json:"currency,omitempty"`
	TotalMinorUnits *int64  `json:"totalMinorUnits,omitempty"`
	Shop            *string `json:"shop,omitempty"`
}

type Item struct {
	Title              string              `json:"title"`
	LineKind           string              `json:"lineKind"`
	CostMinorUnits     *int64              `json:"costMinorUnits,omitempty"`
	ComponentID        *string             `json:"componentId,omitempty"`
	SuggestedComponent *SuggestedComponent `json:"suggestedComponent,omitempty"`
	EventType          string              `json:"eventType"`
	Uncertain          bool                `json:"uncertain"`
}

type SuggestedComponent struct {
	Name     string  `json:"name"`
	Category string  `json:"category"`
	Axle     *string `json:"axle,omitempty"`
	Side     *string `json:"side,omitempty"`
}

// responseSchema constrains Gemini's JSON. The component enum lists only
// this request's labels, so the model cannot invent a component.
func responseSchema(components []ContextComponent) map[string]any {
	labels := make([]string, 0, len(components)+1)
	for i := range components {
		labels = append(labels, label(i))
	}
	labels = append(labels, noComponent)

	str := func(desc string) map[string]any {
		return map[string]any{"type": "STRING", "nullable": true, "description": desc}
	}
	enum := func(values []string, nullable bool) map[string]any {
		return map[string]any{"type": "STRING", "enum": values, "nullable": nullable}
	}

	document := map[string]any{
		"type": "OBJECT",
		"properties": map[string]any{
			"kind":      enum(docKinds, false),
			"date":      str("Дата работ или покупки, YYYY-MM-DD"),
			"mileageKm": map[string]any{"type": "INTEGER", "nullable": true, "description": "Пробег в км"},
			"currency":  str("Код валюты ISO 4217, например RUB"),
			"total":     str("Итоговая сумма числом, например 4520.00"),
			"shop":      str("Название сервиса или магазина"),
		},
		"required":         []string{"kind", "date", "mileageKm", "currency", "total", "shop"},
		"propertyOrdering": []string{"kind", "date", "mileageKm", "currency", "total", "shop"},
	}
	itemOrder := []string{"title", "lineKind", "cost", "component", "suggestedName",
		"suggestedCategory", "suggestedAxle", "suggestedSide", "eventType", "uncertain"}
	item := map[string]any{
		"type": "OBJECT",
		"properties": map[string]any{
			"title":             map[string]any{"type": "STRING"},
			"lineKind":          enum(lineKinds, false),
			"cost":              str("Стоимость строки числом, например 3200.00"),
			"component":         enum(labels, false),
			"suggestedName":     str("Название нового компонента, если component = none"),
			"suggestedCategory": enum(categories, true),
			"suggestedAxle":     enum(axles, true),
			"suggestedSide":     enum(sides, true),
			"eventType":         enum(eventTypes, false),
			"uncertain":         map[string]any{"type": "BOOLEAN"},
		},
		"required":         itemOrder,
		"propertyOrdering": itemOrder,
	}
	return map[string]any{
		"type": "OBJECT",
		"properties": map[string]any{
			"document": document,
			"items":    map[string]any{"type": "ARRAY", "items": item},
			"warnings": map[string]any{"type": "ARRAY", "items": map[string]any{"type": "STRING"}},
		},
		"required":         []string{"document", "items", "warnings"},
		"propertyOrdering": []string{"document", "items", "warnings"},
	}
}

// normalize turns the model's output into a Result. The model is not
// trusted: a value that fails a check is dropped with a warning instead of
// failing the whole draft.
func normalize(out modelOutput, components []ContextComponent, today time.Time) Result {
	res := Result{Items: []Item{}, Warnings: []string{}}
	warn := func(s string) { res.Warnings = append(res.Warnings, s) }

	for _, w := range out.Warnings {
		if w = strings.TrimSpace(w); w != "" && len(res.Warnings) < maxWarnings {
			warn(truncate(w, maxTitleLen))
		}
	}

	d := out.Document
	res.Document.Kind = oneOf(d.Kind, docKinds, "other")
	if d.Date != nil {
		if date, ok := parseDate(*d.Date, today); ok {
			res.Document.Date = &date
		} else {
			warn("Дату не удалось разобрать: " + truncate(*d.Date, 40))
		}
	}
	if d.MileageKm != nil {
		if *d.MileageKm > 0 && *d.MileageKm <= maxMileageKm {
			res.Document.MileageKm = d.MileageKm
		} else {
			warn("Пробег вне допустимого диапазона")
		}
	}
	if d.Currency != nil {
		if c := strings.ToUpper(strings.TrimSpace(*d.Currency)); isCurrency(c) {
			res.Document.Currency = &c
		}
	}
	if d.Total != nil {
		if m, err := parseMoney(*d.Total); err == nil {
			res.Document.TotalMinorUnits = &m
		} else {
			warn("Итоговую сумму не удалось разобрать")
		}
	}
	res.Document.Shop = optText(d.Shop, maxShopLen)

	for i, x := range out.Items {
		if i == maxItems {
			warn(fmt.Sprintf("Показаны первые %d строк документа", maxItems))
			break
		}
		title := truncate(strings.TrimSpace(x.Title), maxTitleLen)
		if title == "" {
			continue
		}
		it := Item{
			Title:     title,
			LineKind:  oneOf(x.LineKind, lineKinds, "other"),
			EventType: oneOf(x.EventType, eventTypes, "repair"),
			Uncertain: x.Uncertain,
		}
		if x.Cost != nil {
			if m, err := parseMoney(*x.Cost); err == nil {
				it.CostMinorUnits = &m
			} else {
				it.Uncertain = true
			}
		}
		if id, ok := componentID(x.Component, components); ok {
			it.ComponentID = &id
		} else if name := optText(x.SuggestedName, maxNameLen); name != nil {
			it.SuggestedComponent = suggested(*name, x.SuggestedCategory, x.SuggestedAxle, x.SuggestedSide)
		}
		res.Items = append(res.Items, it)
	}
	return res
}

// suggested builds a new-component proposal. Axle and side are kept only
// for the systems the app positions, as its forms do.
func suggested(name string, category, axle, side *string) *SuggestedComponent {
	sc := &SuggestedComponent{Name: name, Category: "other"}
	if category != nil {
		sc.Category = oneOf(*category, categories, "other")
	}
	if !slices.Contains(positioned, sc.Category) {
		return sc
	}
	if axle != nil && slices.Contains(axles, *axle) {
		sc.Axle = axle
	}
	if side != nil && slices.Contains(sides, *side) {
		sc.Side = side
	}
	return sc
}

func componentID(lbl string, components []ContextComponent) (string, bool) {
	n, ok := strings.CutPrefix(lbl, "c")
	if !ok {
		return "", false
	}
	i, err := strconv.Atoi(n)
	if err != nil || i < 1 || i > len(components) {
		return "", false
	}
	return components[i-1].ID, true
}

// parseDate accepts YYYY-MM-DD between 1950 and tomorrow (time zones).
func parseDate(s string, today time.Time) (string, bool) {
	t, err := time.Parse(time.DateOnly, strings.TrimSpace(s))
	if err != nil || t.Year() < 1950 || t.After(today.AddDate(0, 0, 1)) {
		return "", false
	}
	return t.Format(time.DateOnly), true
}

// parseMoney turns "3 200,50", "3200.5" or "3200" into minor units (320050).
func parseMoney(s string) (int64, error) {
	s = strings.Map(func(r rune) rune {
		switch r {
		case ' ', ' ', ' ', '\'':
			return -1
		case ',':
			return '.'
		}
		return r
	}, strings.TrimSpace(s))
	s = strings.TrimSuffix(strings.TrimSuffix(s, "₽"), "р.")

	whole, frac, _ := strings.Cut(s, ".")
	if whole == "" || len(frac) > 2 || !digits(whole) || !digits(frac) {
		return 0, errors.New("not an amount")
	}
	for len(frac) < 2 {
		frac += "0"
	}
	if len(whole) > 12 {
		return 0, errors.New("amount too large")
	}
	n, err := strconv.ParseInt(whole+frac, 10, 64)
	if err != nil || n > maxMinorUnits {
		return 0, errors.New("amount too large")
	}
	return n, nil
}

func digits(s string) bool {
	for _, r := range s {
		if r < '0' || r > '9' {
			return false
		}
	}
	return true
}

func isCurrency(s string) bool {
	if len(s) != 3 {
		return false
	}
	for _, r := range s {
		if r < 'A' || r > 'Z' {
			return false
		}
	}
	return true
}

func oneOf(s string, allowed []string, fallback string) string {
	if slices.Contains(allowed, s) {
		return s
	}
	return fallback
}

func optText(s *string, max int) *string {
	if s == nil {
		return nil
	}
	t := truncate(strings.TrimSpace(*s), max)
	if t == "" {
		return nil
	}
	return &t
}

func truncate(s string, max int) string {
	if utf8.RuneCountInString(s) <= max {
		return s
	}
	return string([]rune(s)[:max])
}
