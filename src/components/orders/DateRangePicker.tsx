'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'

interface DateRangePickerProps {
  onRangeSelect: (startDate: Date | null, endDate: Date | null) => void
  className?: string
}

export default function DateRangePicker({ onRangeSelect, className = '' }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  // Temporary selection (shown in calendar while open)
  const [tempStartDate, setTempStartDate] = useState<Date | null>(null)
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null)
  // Applied selection (actually used for filtering)
  const [appliedStartDate, setAppliedStartDate] = useState<Date | null>(null)
  const [appliedEndDate, setAppliedEndDate] = useState<Date | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [hoverDate, setHoverDate] = useState<Date | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-select today's date when calendar opens
  useEffect(() => {
    if (isOpen && !tempStartDate && !tempEndDate) {
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Reset time to midnight
      setTempStartDate(today)
      setCurrentMonth(today)
    }
  }, [isOpen, tempStartDate, tempEndDate])

  // Reset temporary selection when closing without applying
  useEffect(() => {
    if (!isOpen) {
      // Reset temp dates to match applied dates when closing
      setTempStartDate(appliedStartDate)
      setTempEndDate(appliedEndDate)
    }
  }, [isOpen, appliedStartDate, appliedEndDate])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    return new Date(year, month, 1).getDay()
  }

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    clickedDate.setHours(0, 0, 0, 0)

    if (!tempStartDate) {
      setTempStartDate(clickedDate)
      setTempEndDate(null)
    } else if (tempStartDate && !tempEndDate) {
      if (clickedDate < tempStartDate) {
        setTempEndDate(tempStartDate)
        setTempStartDate(clickedDate)
      } else if (clickedDate.getTime() === tempStartDate.getTime()) {
        setTempEndDate(clickedDate)
      } else {
        setTempEndDate(clickedDate)
      }
    } else if (tempStartDate && tempEndDate) {
      setTempStartDate(clickedDate)
      setTempEndDate(null)
    }
  }

  const handleApply = () => {
    setAppliedStartDate(tempStartDate)
    setAppliedEndDate(tempEndDate)
    onRangeSelect(tempStartDate, tempEndDate)
    setIsOpen(false)
  }

  const handleClear = () => {
    setTempStartDate(null)
    setTempEndDate(null)
    setAppliedStartDate(null)
    setAppliedEndDate(null)
    onRangeSelect(null, null)
  }

  const isDateInRange = (day: number) => {
    if (!tempStartDate) return false
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)

    if (tempEndDate) {
      return date >= tempStartDate && date <= tempEndDate
    } else if (hoverDate) {
      if (hoverDate > tempStartDate) {
        return date >= tempStartDate && date <= hoverDate
      } else if (hoverDate < tempStartDate) {
        return date >= hoverDate && date <= tempStartDate
      }
    }

    return false
  }

  const isDateSelected = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return (
      (tempStartDate && date.toDateString() === tempStartDate.toDateString()) ||
      (tempEndDate && date.toDateString() === tempEndDate.toDateString())
    )
  }

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const formatDateRange = () => {
    if (!appliedStartDate) return 'Select date range'
    if (!appliedEndDate) return `${appliedStartDate.toLocaleDateString()}`
    return `${appliedStartDate.toLocaleDateString()} - ${appliedEndDate.toLocaleDateString()}`
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getFirstDayOfMonth(currentMonth)
    const days = []

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-9" />)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isInRange = isDateInRange(day)
      const isSelected = isDateSelected(day)
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateClick(day)}
          onMouseEnter={() => setHoverDate(date)}
          className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${
            isSelected
              ? 'bg-[#1D0DF3] text-white hover:bg-[#1a0cd9]'
              : isInRange
                ? 'bg-[#1D0DF3]/10 text-[#1D0DF3]'
                : 'text-[#292929] hover:bg-[#F8F8F8]'
          }`}
          style={{ fontFamily: 'var(--font-geist-sans)' }}
        >
          {day}
        </button>,
      )
    }

    return days
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
          appliedStartDate || appliedEndDate
            ? 'bg-[#1D0DF3] text-white border-[#1D0DF3]'
            : 'bg-[#F8F8F8] text-[#292929] border-[#DCDCDC] hover:bg-[#EFEFEF]'
        }`}
        style={{ fontFamily: 'var(--font-geist-sans)' }}
      >
        <Calendar className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1 text-left truncate">{formatDateRange()}</span>
        {(appliedStartDate || appliedEndDate) && (
          <X
            className="h-3.5 w-3.5 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation()
              handleClear()
            }}
          />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-[#EFEFEF] rounded-[20px] shadow-lg z-50 p-4 min-w-[320px]">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={previousMonth}
              className="p-2 hover:bg-[#F8F8F8] rounded-lg transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-[#292929]" />
            </button>
            <div
              className="text-sm font-semibold text-[#292929]"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            <button
              type="button"
              onClick={nextMonth}
              className="p-2 hover:bg-[#F8F8F8] rounded-lg transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-[#292929]" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div
                key={day}
                className="h-9 flex items-center justify-center text-xs font-semibold text-[#989898]"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 mb-4">{renderCalendar()}</div>

          <div className="flex items-center justify-between gap-2 pt-4 border-t border-[#EFEFEF]">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 text-sm font-medium text-[#989898] hover:text-[#292929] transition-colors"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!tempStartDate || !tempEndDate}
              className="px-4 py-2 bg-[#1D0DF3] text-white rounded-lg text-sm font-medium hover:bg-[#1a0cd9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
