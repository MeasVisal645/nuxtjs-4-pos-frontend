<script setup lang="ts">
import { DateFormatter, getLocalTimeZone, CalendarDate, today } from '@internationalized/date'
import type { Range } from '~/types'

const df = new DateFormatter('en-US', { dateStyle: 'medium' })

const selected = defineModel<Range>({ required: true })

const ranges = [
  { label: 'Last 7 days', days: 8 },
  { label: 'Last 14 days', days: 15 },
  { label: 'Last 30 days', days: 31 },
  { label: 'Last 3 months', months: 3 },
  { label: 'Last 6 months', months: 6 },
  { label: 'Last year', years: 1 }
]

const normalizeDate = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

const toCalendarDate = (date: Date) => {
  return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

const calendarRange = computed({
  get: () => ({
    start: selected.value.start ? toCalendarDate(selected.value.start) : undefined,
    end: selected.value.end ? toCalendarDate(selected.value.end) : undefined
  }),
  set: (newValue: { start: CalendarDate | null, end: CalendarDate | null }) => {
    selected.value = {
      start: newValue.start ? normalizeDate(newValue.start.toDate(getLocalTimeZone())) : normalizeDate(new Date()),
      end: newValue.end ? normalizeDate(newValue.end.toDate(getLocalTimeZone())) : normalizeDate(new Date())
    }
  }
})

const computeStartDate = (range: { days?: number, months?: number, years?: number }) => {
  const endDate = today(getLocalTimeZone())
  let startDate = endDate.copy()

  if (range.days) startDate = startDate.subtract({ days: range.days - 1 })
  else if (range.months) startDate = startDate.subtract({ months: range.months })
  else if (range.years) startDate = startDate.subtract({ years: range.years })

  return { startDate, endDate }
}

const isRangeSelected = (range: { days?: number, months?: number, years?: number }) => {
  if (!selected.value.start || !selected.value.end) return false

  const { startDate, endDate } = computeStartDate(range)

  const selectedStart = toCalendarDate(selected.value.start)
  const selectedEnd = toCalendarDate(selected.value.end)

  return selectedStart.compare(startDate) === 0 && selectedEnd.compare(endDate) === 0
}

const selectRange = (range: { days?: number, months?: number, years?: number }) => {
  const { startDate, endDate } = computeStartDate(range)

  selected.value = {
    start: normalizeDate(startDate.toDate(getLocalTimeZone())),
    end: normalizeDate(endDate.toDate(getLocalTimeZone()))
  }
}
</script>

<template>
  <UPopover :content="{ align: 'start' }" :modal="true">
    <UButton
      color="neutral"
      variant="ghost"
      icon="i-lucide-calendar"
      class="data-[state=open]:bg-elevated group"
    >
      <span class="truncate">
        <template v-if="selected.start">
          <template v-if="selected.end">
            {{ df.format(selected.start) }} - {{ df.format(selected.end) }}
          </template>
          <template v-else>
            {{ df.format(selected.start) }}
          </template>
        </template>
        <template v-else>
          Pick a date
        </template>
      </span>

      <template #trailing>
        <UIcon
          name="i-lucide-chevron-down"
          class="shrink-0 text-dimmed size-5 group-data-[state=open]:rotate-180 transition-transform duration-200"
        />
      </template>
    </UButton>

    <template #content>
      <div class="flex items-stretch sm:divide-x divide-default">
        <div class="hidden sm:flex flex-col justify-center">
          <UButton
            v-for="(range, index) in ranges"
            :key="index"
            :label="range.label"
            color="neutral"
            variant="ghost"
            class="rounded-none px-4"
            :class="[isRangeSelected(range) ? 'bg-elevated' : 'hover:bg-elevated/50']"
            truncate
            @click="selectRange(range)"
          />
        </div>

        <UCalendar
          v-model="calendarRange"
          class="p-2"
          :number-of-months="2"
          range
        />
      </div>
    </template>
  </UPopover>
</template>
