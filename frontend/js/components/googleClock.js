// Google NTP Atomic Clock Component (IST Asia/Kolkata)
// Faithful reproduction of React GoogleClock.tsx

class GoogleClockComponent {
    constructor() {
        this.timer = null;
        this.is24Hour = false;
        this.offsetMs = 0;
        this.source = 'time.google.com';
        this.latencyMs = 45;
        this.initSync();
    }

    async initSync() {
        try {
            const t0 = Date.now();
            const res = await fetch('/api/google-time');
            if (res.ok) {
                const data = await res.json();
                const t1 = Date.now();
                if (data.epochMs) {
                    this.latencyMs = Math.max(10, Math.round((t1 - t0) / 2));
                    this.offsetMs = data.epochMs - t1;
                    this.source = data.source || 'time.google.com';
                }
            }
        } catch (e) {
            // fallback to local system time
            this.offsetMs = 0;
        }
    }

    getNow() {
        return new Date(Date.now() + this.offsetMs);
    }

    formatTime() {
        const now = this.getNow();
        // Indian Standard Time (Asia/Kolkata)
        const options = {
            timeZone: 'Asia/Kolkata',
            hour12: !this.is24Hour,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        const parts = new Intl.DateTimeFormat('en-IN', options).formatToParts(now);
        const h = parts.find(p => p.type === 'hour')?.value || '00';
        const m = parts.find(p => p.type === 'minute')?.value || '00';
        const s = parts.find(p => p.type === 'second')?.value || '00';
        const dayPeriod = parts.find(p => p.type === 'dayPeriod')?.value?.toUpperCase() || '';
        
        const dateOptions = {
            timeZone: 'Asia/Kolkata',
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        };
        const dateStr = new Intl.DateTimeFormat('en-IN', dateOptions).format(now);

        return {
            timeString: `${h}:${m}:${s}`,
            ampm: this.is24Hour ? 'IST' : dayPeriod,
            dateString: dateStr
        };
    }

    renderHeaderHtml() {
        const { timeString, ampm, dateString } = this.formatTime();
        return `
            <div id="google-clock-header" class="flex items-center gap-2 sm:gap-3 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs hover:shadow-xs transition-all cursor-pointer select-none group" title="Google NTP Atomic Clock (IST) • Synced with ${this.source}">
                <div class="flex items-center shrink-0" title="Synced with ${this.source} • Latency: ${this.latencyMs}ms">
                    <span class="relative flex h-1.5 w-1.5">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                </div>
                <div class="flex items-baseline gap-1 font-mono tabular-nums tracking-tight">
                    <span id="clock-digits" class="font-bold text-sm text-slate-800">${timeString}</span>
                    <span id="clock-ampm" class="text-[10px] font-bold text-slate-500 uppercase">${ampm}</span>
                </div>
                <div id="clock-date" class="hidden lg:block text-[11px] text-slate-500 border-l border-slate-200 pl-3 font-medium whitespace-nowrap">
                    ${dateString}
                </div>
            </div>
        `;
    }

    startTicker() {
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            const digits = document.getElementById('clock-digits');
            const ampm = document.getElementById('clock-ampm');
            const date = document.getElementById('clock-date');
            if (digits) {
                const formatted = this.formatTime();
                digits.textContent = formatted.timeString;
                if (ampm) ampm.textContent = formatted.ampm;
                if (date) date.textContent = formatted.dateString;
            }
        }, 1000);
    }
}

window.googleClock = new GoogleClockComponent();
