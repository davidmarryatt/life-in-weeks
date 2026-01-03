import React, { useState, useEffect } from 'react';

export default function LifeInWeeks() {
  const [birthDate, setBirthDate] = useState('');
  const [lifeExpectancy, setLifeExpectancy] = useState('80');
  const [showVisualization, setShowVisualization] = useState(false);
  const [memories, setMemories] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [memoryText, setMemoryText] = useState('');
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [hoveredWeek, setHoveredWeek] = useState(null);
  const [clickedWeek, setClickedWeek] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (showVisualization && birthDate) {
      loadMemories();
    }
  }, [showVisualization, birthDate]);

  const loadMemories = async () => {
    try {
      const result = await window.storage.get(`life-weeks-memories-${birthDate}`);
      if (result && result.value) {
        setMemories(JSON.parse(result.value));
      }
    } catch (error) {
      setMemories({});
    }
  };

  const saveMemories = async (updatedMemories) => {
    try {
      await window.storage.set(
        `life-weeks-memories-${birthDate}`,
        JSON.stringify(updatedMemories)
      );
    } catch (error) {
      console.error('Failed to save memories:', error);
    }
  };

  const calculateStats = () => {
    if (!birthDate) return null;

    const [year, month, day] = birthDate.split('-').map(Number);
    const birth = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expectedYears = parseInt(lifeExpectancy);
    
    const currentYear = today.getFullYear();
    const birthMonth = birth.getMonth();
    const birthDay = birth.getDate();
    
    let ageInYears = currentYear - birth.getFullYear();
    const currentAnniversary = new Date(currentYear, birthMonth, birthDay);
    
    if (today < currentAnniversary) {
      ageInYears--;
    }
    
    const yearStart = new Date(currentYear - (today < currentAnniversary ? 1 : 0), birthMonth, birthDay);
    const daysSinceYearStart = Math.floor((today - yearStart) / (1000 * 60 * 60 * 24));
    const weekInYear = Math.floor(daysSinceYearStart / 7);
    
    const ageMs = today - birth;
    const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
    const totalWeeksLived = Math.floor(ageDays / 7);
    
    const totalWeeks = expectedYears * 52;
    const remainingWeeks = totalWeeks - totalWeeksLived;
    const percentageLived = (totalWeeksLived / totalWeeks) * 100;

    const heartbeats = Math.floor(ageDays * 24 * 60 * 70);
    const breaths = Math.floor(ageDays * 24 * 60 * 16);
    const sleepHours = Math.floor(ageDays * 8);
    const moonCycles = Math.floor(ageDays / 29.53);
    
    return {
      ageInYears,
      weekInYear,
      totalWeeksLived,
      totalWeeks,
      remainingWeeks,
      ageDays,
      percentageLived: percentageLived.toFixed(1),
      heartbeats,
      breaths,
      sleepHours,
      moonCycles,
      expectedYears,
      birth
    };
  };

  const stats = calculateStats();

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const handleVisualize = () => {
    if (birthDate && lifeExpectancy) {
      setShowVisualization(true);
    }
  };

  const getWeekDates = (yearIndex, weekIndex) => {
    if (!stats) return [];
    
    const birth = stats.birth;
    const yearStart = new Date(birth.getFullYear() + yearIndex, birth.getMonth(), birth.getDate());
    const weekStart = new Date(yearStart);
    weekStart.setDate(yearStart.getDate() + (weekIndex * 7));
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  const getWeekDateRange = (yearIndex, weekIndex) => {
    const dates = getWeekDates(yearIndex, weekIndex);
    if (dates.length === 0) return '';
    
    const startDate = dates[0];
    const endDate = dates[6];
    
    const formatShort = (date) => {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      });
    };
    
    return `${formatShort(startDate)} - ${formatShort(endDate)}, ${startDate.getFullYear()}`;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      weekday: 'short'
    });
  };

  const formatDateKey = (date) => {
    return date.toISOString().split('T')[0];
  };

  const weekHasMemory = (yearIndex, weekIndex) => {
    const dates = getWeekDates(yearIndex, weekIndex);
    return dates.some(date => memories[formatDateKey(date)]);
  };

  const handleSaveMemory = async () => {
    const updatedMemories = { ...memories };
    
    if (memoryText.trim()) {
      updatedMemories[selectedDate] = memoryText.trim();
    } else {
      delete updatedMemories[selectedDate];
    }
    
    setMemories(updatedMemories);
    await saveMemories(updatedMemories);
    setShowMemoryModal(false);
    setSelectedDate(null);
    setMemoryText('');
  };

  const handleCloseModal = () => {
    setShowMemoryModal(false);
    setSelectedDate(null);
    setMemoryText('');
  };

  const WeekDot = ({ yearIndex, weekIndex, isPastWeek, isCurrentWeek, hasMemory }) => {
    const handleMouseEnter = (e) => {
      const rect = e.target.getBoundingClientRect();
      // Position 6 rows above (each row is roughly 8px: 6px dot + 2px gap)
      const rowHeight = 8;
      const offsetRows = 6;
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - (rowHeight * offsetRows)
      });
      setHoveredWeek({ yearIndex, weekIndex });
    };

    return (
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setHoveredWeek(null)}
        onClick={() => setClickedWeek({ yearIndex, weekIndex })}
        className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer border border-gray-600 ${
          isCurrentWeek
            ? 'bg-gray-900 scale-150'
            : isPastWeek
            ? hasMemory
              ? 'bg-blue-500'
              : 'bg-gray-400'
            : 'bg-gray-200'
        } hover:scale-150 hover:ring-2 hover:ring-gray-400`}
      />
    );
  };

  if (!showVisualization) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-light text-gray-900 mb-2">Life in weeks</h1>
          <p className="text-sm text-gray-600 mb-12">
            A simple visualization to reflect on the passage of time
          </p>

          <div className="space-y-8">
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                When were you born?
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-gray-900 transition-colors text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Expected life span (years)
              </label>
              <input
                type="number"
                value={lifeExpectancy}
                onChange={(e) => setLifeExpectancy(e.target.value)}
                min="1"
                max="120"
                className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-gray-900 transition-colors text-gray-900"
              />
            </div>

            <button
              onClick={handleVisualize}
              className="w-full py-3 bg-gray-900 text-white text-sm font-light hover:bg-gray-800 transition-colors"
            >
              Visualize
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalRows = stats.expectedYears;
  const grid = [];

  for (let yearIndex = 0; yearIndex < totalRows; yearIndex++) {
    const weeks = [];
    const isCurrentYear = yearIndex === stats.ageInYears;
    const isPastYear = yearIndex < stats.ageInYears;
    
    for (let weekIndex = 0; weekIndex < 52; weekIndex++) {
      const isPastWeek = isPastYear || (isCurrentYear && weekIndex < stats.weekInYear);
      const isCurrentWeek = isCurrentYear && weekIndex === stats.weekInYear;
      const hasMemory = weekHasMemory(yearIndex, weekIndex);

      weeks.push(
        <WeekDot
          key={weekIndex}
          yearIndex={yearIndex}
          weekIndex={weekIndex}
          isPastWeek={isPastWeek}
          isCurrentWeek={isCurrentWeek}
          hasMemory={hasMemory}
        />
      );
    }
    
    const yearStart = stats.birth.getFullYear() + yearIndex;
    const yearEnd = yearStart + 1;
    
    grid.push(
      <div key={yearIndex} className="flex items-center gap-3 justify-center">
        <div className="text-[10px] text-gray-700 font-light w-16 text-right">
          {yearStart}-{yearEnd}
        </div>
        <div className="flex gap-1.5">
          {weeks}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-16">
        <div className="mb-12">
          <h1 className="text-2xl font-light text-gray-900 mb-4">Your life in weeks</h1>
          <p className="text-sm text-gray-600 max-w-xl">
            Each row represents one year starting from your birth date. Each dot is one week. 
            The darker dots are weeks you've lived. The large dot marks this week.
            Hover to see dates, click to add memories.
          </p>
        </div>

        <div>
          <div className="flex flex-col gap-2 my-12">{grid}</div>
          <div className="text-xs text-gray-500 text-center">
            Year {stats.ageInYears + 1} of {totalRows} • Week {stats.weekInYear + 1} of 52
          </div>
        </div>

        {hoveredWeek && (
          <div 
            className="fixed bg-gray-900 text-white rounded px-2 py-1 text-xs pointer-events-none whitespace-nowrap"
            style={{ 
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform: 'translateX(-50%)',
              zIndex: 9998
            }}
          >
            {getWeekDateRange(hoveredWeek.yearIndex, hoveredWeek.weekIndex)}
          </div>
        )}

        {clickedWeek && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50"
            onClick={() => setClickedWeek(null)}
          >
            <div 
              className="bg-white rounded shadow-xl border border-gray-300 p-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-xs font-light text-gray-900 mb-2 whitespace-nowrap">Select a date:</div>
              <div className="flex flex-col gap-1">
                {getWeekDates(clickedWeek.yearIndex, clickedWeek.weekIndex).map((date, idx) => {
                  const dateKey = formatDateKey(date);
                  const hasMemory = memories[dateKey];
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedDate(dateKey);
                        setMemoryText(memories[dateKey] || '');
                        setShowMemoryModal(true);
                        setClickedWeek(null);
                      }}
                      className={`text-left px-3 py-1.5 text-xs rounded transition-colors whitespace-nowrap ${
                        hasMemory 
                          ? 'bg-blue-50 text-blue-900 hover:bg-blue-100' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {formatDate(date)}
                      {hasMemory && <span className="ml-2 text-blue-500 text-xs">●</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {showMemoryModal && selectedDate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-light text-gray-900 mb-2">Add a memory</h3>
              <p className="text-sm text-gray-600 mb-4">
                {formatDate(new Date(selectedDate + 'T00:00:00'))}
              </p>
              <textarea
                value={memoryText}
                onChange={(e) => setMemoryText(e.target.value)}
                placeholder="What happened on this day? What do you want to remember?"
                className="w-full h-32 px-3 py-2 border border-gray-300 focus:outline-none focus:border-gray-900 transition-colors text-gray-900 text-sm resize-none"
                autoFocus
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleSaveMemory}
                  className="flex-1 py-2 bg-gray-900 text-white text-sm font-light hover:bg-gray-800 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={handleCloseModal}
                  className="flex-1 py-2 bg-gray-200 text-gray-900 text-sm font-light hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-12 mt-16">
          <div className="border-t border-gray-200 pt-12">
            <h2 className="text-lg font-light text-gray-900 mb-8">Time lived</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
              <div>
                <div className="text-3xl font-light text-gray-900 mb-1">
                  {formatNumber(stats.totalWeeksLived)}
                </div>
                <div className="text-gray-600">weeks lived</div>
              </div>
              
              <div>
                <div className="text-3xl font-light text-gray-900 mb-1">
                  {stats.percentageLived}%
                </div>
                <div className="text-gray-600">of expected life</div>
              </div>

              <div>
                <div className="text-3xl font-light text-gray-900 mb-1">
                  {formatNumber(stats.ageDays)}
                </div>
                <div className="text-gray-600">days of experience</div>
              </div>

              <div>
                <div className="text-3xl font-light text-gray-900 mb-1">
                  {formatNumber(stats.remainingWeeks)}
                </div>
                <div className="text-gray-600">weeks ahead</div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-12">
            <h2 className="text-lg font-light text-gray-900 mb-8">Biological rhythms</h2>
            <div className="space-y-6 text-sm">
              <div>
                <div className="text-gray-900 mb-1">
                  Your heart has beaten approximately{' '}
                  <span className="font-normal">{formatNumber(stats.heartbeats)}</span> times
                </div>
              </div>

              <div>
                <div className="text-gray-900 mb-1">
                  You've taken around{' '}
                  <span className="font-normal">{formatNumber(stats.breaths)}</span> breaths
                </div>
              </div>

              <div>
                <div className="text-gray-900 mb-1">
                  You've slept approximately{' '}
                  <span className="font-normal">{formatNumber(stats.sleepHours)}</span> hours
                </div>
              </div>

              <div>
                <div className="text-gray-900 mb-1">
                  You've witnessed{' '}
                  <span className="font-normal">{formatNumber(stats.moonCycles)}</span> full moon cycles
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-12">
            <h2 className="text-lg font-light text-gray-900 mb-8">Perspective</h2>
            <div className="space-y-6 text-sm text-gray-700 max-w-2xl">
              <p>
                If you live to {stats.expectedYears}, you will have experienced approximately {formatNumber(stats.totalWeeks)} weeks. 
                Each one a chance to learn, create, connect, and reflect.
              </p>
              <p>
                The ancient Stoics believed in "memento mori" — remembering that our time is finite. 
                Not to invoke fear, but to inspire presence and meaning in each moment.
              </p>
              <p>
                What will you do with your remaining {formatNumber(stats.remainingWeeks)} weeks?
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowVisualization(false)}
          className="mt-16 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          ← Start over
        </button>
      </div>
    </div>
  );
}