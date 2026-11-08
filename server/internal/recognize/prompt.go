package recognize

import (
	"fmt"
	"strings"
	"time"
)

const systemPrompt = `Ты разбираешь документы об обслуживании автомобиля: кассовые чеки,
заказ-наряды автосервисов, рукописные записи владельца. Верни черновик для
проверки человеком. Ничего не придумывай: чего нет в документе или что не
читается, оставь null.

Документ:
- kind: fiscal_receipt — кассовый чек; work_order — заказ-наряд или акт
  выполненных работ; handwritten — запись от руки; other — иное.
- date — дата работ или покупки в формате YYYY-MM-DD. Если год не указан,
  возьми ближайший прошедший.
- mileageKm — пробег автомобиля в километрах, только если он явно указан.
  Не путай с номером документа, артикулом, ИНН или ценой.
- total — итог к оплате, числом без пробелов и знака валюты, с точкой
  (например 4520.00).

Строки (items) — по одной на каждую работу или товар:
- title — как в документе, без артикулов и кодов, если они мешают читать.
- lineKind: part — запчасть; fluid — масло, жидкость; labor — работа или
  услуга; other — остальное (пакет, скидка, доставка).
- cost — итоговая стоимость строки (цена × количество с учётом скидки).
- component — метка подходящего компонента из списка автомобиля или none.
  Выбирай метку, только если строка точно относится к этому компоненту,
  учитывая ось и сторону. Работу (labor) привязывай к компоненту, с которым
  она выполнена, например «замена масла» → компонент моторного масла.
- suggestedName, suggestedCategory, suggestedAxle, suggestedSide — только
  если component = none, а строка относится к конкретной детали или жидкости
  автомобиля (в том числе работа: «замена ступичного подшипника»). Название —
  короткое общее имя компонента («Ступичный подшипник», «Воздушный фильтр»), без
  марки, артикула и позиции. Ось (front/rear) и сторону (left/right) указывай,
  только если они явно написаны в строке. Для общих работ без детали
  (диагностика, мойка) — null.
- eventType: replacement — замена детали; purchase — покупка нового для
  машины (видеорегистратор, запасное колесо); fluid_service — замена или
  долив жидкости; repair — ремонт; inspection — диагностика, осмотр.
- uncertain — true, если строка читается плохо или ты не уверен в цифрах.

warnings — короткие замечания на русском для владельца: что не читается,
что выглядит странно. Пустой массив, если замечаний нет.`

// userPrompt lists the vehicle's components under the labels the response
// schema allows.
func userPrompt(components []ContextComponent, today time.Time) string {
	var b strings.Builder
	fmt.Fprintf(&b, "Сегодня %s.\n\n", today.Format(time.DateOnly))
	if len(components) == 0 {
		b.WriteString("У автомобиля пока нет компонентов: для всех строк component = none.\n")
	} else {
		b.WriteString("Компоненты автомобиля:\n")
		for i, c := range components {
			fmt.Fprintf(&b, "%s: %s [%s%s]\n", label(i), strings.Join(strings.Fields(c.Name), " "), c.Category, position(c))
		}
	}
	b.WriteString("\nРазбери приложенный документ.")
	return b.String()
}

func position(c ContextComponent) string {
	var parts []string
	if c.Axle != nil {
		parts = append(parts, map[string]string{"front": "перед", "rear": "зад"}[*c.Axle])
	}
	if c.Side != nil {
		parts = append(parts, map[string]string{"left": "левый", "right": "правый"}[*c.Side])
	}
	if len(parts) == 0 {
		return ""
	}
	return ", " + strings.Join(parts, " ")
}
