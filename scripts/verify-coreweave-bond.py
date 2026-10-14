"""Independent reference: Python Decimal, 50 digits, plain periodic bisection.
No application formulas are imported. Dates follow the supplied Feb/Aug contract.
"""
import json
import sys
from pathlib import Path
from datetime import date
from decimal import Decimal, getcontext

getcontext().prec = 50
settlement = date(2026, 10, 14)
previous = date(2026, 8, 1)
next_coupon = date(2027, 2, 1)
maturity = date(2031, 2, 1)

def days_30_us(a, b):
    def last_feb(d):
        return d.month == 2 and date.fromordinal(d.toordinal() + 1).month == 3
    d1, d2 = a.day, b.day
    if last_feb(a) and last_feb(b):
        d2 = 30
    if last_feb(a) or d1 == 31:
        d1 = 30
    if d2 == 31 and d1 >= 30:
        d2 = 30
    return 360*(b.year-a.year) + 30*(b.month-a.month) + d2-d1

dates = [date(year, month, 1) for year in range(2027, 2032)
         for month in (2, 8) if settlement < date(year, month, 1) <= maturity]
coupon = Decimal(100)*Decimal('0.09')/2
elapsed = days_30_us(previous, settlement)
remaining = days_30_us(settlement, next_coupon)
period = days_30_us(previous, next_coupon)
accrued = coupon*Decimal(elapsed)/period
dirty = Decimal('84.30')+accrued
w = Decimal(remaining)/period
flows = [(w+i, coupon+(100 if d == maturity else 0)) for i, d in enumerate(dates)]
low, high = Decimal('-0.5'), Decimal('0.5')
for _ in range(220):
    r = (low+high)/2
    value = sum(amount/(1+r)**exponent for exponent, amount in flows)
    if value > dirty:
        low = r
    else:
        high = r
r = (low+high)/2
reference = {
    'dates': [d.isoformat() for d in dates], 'elapsedDays': elapsed,
    'remainingDays': remaining, 'periodDays': period, 'accrued': str(accrued),
    'dirty': str(dirty), 'w': str(w),
    'flows': [{'date': d.isoformat(), 'periods': str(t), 'amount': str(amount)}
              for d, (t, amount) in zip(dates, flows)],
    'periodicYield': str(r), 'nominalYield': str(2*r), 'effectiveYield': str((1+r)**2-1)
}
if '--check' in sys.argv:
    stored = json.loads((Path(__file__).parent / 'fixtures/coreweave-bond-reference.json').read_text())
    assert stored == reference, 'Independent Decimal reference changed'
    print('PASS: independent 50-digit Decimal calendar, accrued interest, cash flows and yields.')
else:
    print(json.dumps(reference, indent=2))
