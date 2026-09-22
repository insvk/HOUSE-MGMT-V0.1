// Exact, faithful Vanilla JS reproduction of React LoginPage.tsx
// CHE-MADURA HS-1 MGMT V0.1

const DEFAULT_AVATARS = [
  { id: 'avatar-1', label: 'Executive Man', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80' },
  { id: 'avatar-2', label: 'Professional Man', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80' },
  { id: 'avatar-3', label: 'Modern Woman', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=250&auto=format&fit=crop&q=80' },
  { id: 'avatar-4', label: 'Classic Gentleman', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80' },
  { id: 'avatar-5', label: 'Architect / Designer', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=250&auto=format&fit=crop&q=80' },
  { id: 'avatar-6', label: 'Young Resident', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=250&auto=format&fit=crop&q=80' },
  { id: 'avatar-7', label: 'Professional Woman', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=250&auto=format&fit=crop&q=80' },
  { id: 'avatar-8', label: 'Senior Resident', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=250&auto=format&fit=crop&q=80' }
];

const AVAILABLE_FLATS = ['GF', 'F01 - FRONT', 'F01 - BACK', 'F02 - FRONT', 'F02 - BACK'];

let currentAuthMode = 'login'; // 'login' | 'signup' | 'forgot_password'
let selectedAvatarUrl = DEFAULT_AVATARS[0].url;
let showPresetsGrid = false;
let isPasswordVisible = false;

function renderLogin() {
    const root = document.getElementById('app-root');
    if (!root) return;

    root.innerHTML = `
    <div id="login-container" class="min-h-screen w-full bg-[#f4f7fb] text-[#111827] flex flex-col justify-between selection:bg-[#111827] selection:text-white relative overflow-hidden font-sans">
      <!-- Ambient Interactive Spotlight Background -->
      <div id="mouse-spotlight" class="absolute w-[800px] h-[800px] bg-[#38bdf8]/20 rounded-full blur-[100px] pointer-events-none transition-transform duration-100 ease-out z-0" style="transform: translate(200px, 100px);"></div>
      
      <!-- Top Header -->
      <header class="px-4 sm:px-8 py-4 sm:py-7 flex items-center justify-between w-full max-w-7xl mx-auto z-20 gap-2 relative">
        <span class="font-extrabold text-xs sm:text-base md:text-xl tracking-tight text-[#111827] uppercase font-sans truncate">
          CHE-MADURA HS-1 MGMT V0.1
        </span>
        <div class="flex items-center gap-2 sm:gap-3 shrink-0">
          ${window.googleClock ? window.googleClock.renderHeaderHtml() : ''}
          <button
            type="button"
            id="toggle-auth-mode-btn"
            class="text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors cursor-pointer"
          >
            ${currentAuthMode === 'login' ? 'Create Account →' : '← Login'}
          </button>
        </div>
      </header>

      <!-- Main Center Form Card -->
      <main class="w-full flex-1 flex items-center justify-center z-10 p-3 sm:p-4 relative">
        <div class="w-full max-w-[400px] bg-white rounded-2xl p-5 sm:p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative">
          
          ${currentAuthMode === 'login' ? renderSignInCard() : renderSignUpCard()}

        </div>
      </main>

      <!-- Bottom Footer -->
      <footer class="py-6 text-center text-xs text-slate-400 z-10 relative">
        <p class="font-medium">CHE-MADURA HS-1 MGMT • V0.1</p>
        <p class="mt-1 text-[11px] text-slate-400/80">No. 42, Bypass Road, Ellis Nagar, Maduravoyal, Tamil Nadu - 625001</p>
      </footer>
    </div>
    `;

    // Start clock ticker
    if (window.googleClock) window.googleClock.startTicker();

    // Attach spotlight mouse move listener
    const container = document.getElementById('login-container');
    const spotlight = document.getElementById('mouse-spotlight');
    if (container && spotlight) {
        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left - 400;
            const y = e.clientY - rect.top - 400;
            spotlight.style.transform = `translate(${x}px, ${y}px)`;
        });
    }

    // Attach mode switch button
    const toggleBtn = document.getElementById('toggle-auth-mode-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            currentAuthMode = (currentAuthMode === 'login') ? 'signup' : 'login';
            renderLogin();
        });
    }

    // Attach Lucide icons safely
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        try { window.lucide.createIcons(); } catch (e) {}
    }

    // Attach Form handlers
    if (currentAuthMode === 'login') {
        attachSignInEvents();
    } else {
        attachSignUpEvents();
    }
}

function renderSignInCard() {
    return `
    <div class="animate-in fade-in duration-200">
      <div class="flex flex-col items-center text-center mb-8">
        <div class="w-12 h-12 bg-[#111827] rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-black/10">
          <i data-lucide="zap" class="w-6 h-6 text-white fill-white"></i>
        </div>
        <h1 class="text-[26px] font-bold text-[#111827] tracking-tight mb-1">
          Welcome back
        </h1>
        <p class="text-[13px] text-slate-500 font-medium">
          Enter your credentials to access your account
        </p>
      </div>

      <div id="login-error-box" class="hidden mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
        <i data-lucide="alert-circle" class="w-4 h-4 shrink-0"></i>
        <span id="login-error-text"></span>
      </div>

      <div id="login-success-box" class="hidden mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
        <i data-lucide="check-circle-2" class="w-4 h-4 shrink-0"></i>
        <span id="login-success-text"></span>
      </div>

      <form id="sign-in-form" class="space-y-4">
        <div>
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            EMAIL, USERNAME, OR TENANT ID
          </label>
          <input
            id="login-identifier"
            type="text"
            required
            placeholder="Email, @username, Tenant ID, or Flat #"
            class="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm text-[#111827] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all shadow-sm"
          />
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              PASSWORD
            </label>
            <button type="button" id="forgot-password-link" class="text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">
              Forgot password?
            </button>
          </div>
          <div class="relative">
            <input
              id="login-password"
              type="${isPasswordVisible ? 'text' : 'password'}"
              required
              placeholder="••••••••"
              class="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm text-[#111827] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all shadow-sm"
            />
            <button
              type="button"
              id="toggle-pwd-btn"
              class="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <i data-lucide="${isPasswordVisible ? 'eye-off' : 'eye'}" class="w-4 h-4"></i>
            </button>
          </div>
        </div>

        <button
          type="submit"
          id="sign-in-btn"
          class="w-full py-3.5 px-4 rounded-xl bg-[#0a0a0a] hover:bg-black active:bg-black text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-md mt-6 cursor-pointer"
        >
          <span>Sign In</span>
          <i data-lucide="arrow-right" class="w-4 h-4"></i>
        </button>

        <div class="flex items-center justify-center py-2 mt-4">
          <div class="flex-1 h-px bg-slate-200"></div>
          <span class="px-4 text-[11px] font-medium text-slate-400">Or continue with</span>
          <div class="flex-1 h-px bg-slate-200"></div>
        </div>

        <button
          type="button"
          id="google-sign-in-btn"
          class="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 text-[#374151] font-semibold text-sm border border-slate-200 flex items-center justify-center gap-2.5 transition-all shadow-sm cursor-pointer"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.33 24 12 24z" />
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.17 0 9.99 0 12s.46 3.83 1.26 5.42l4.02-3.15z" />
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
          </svg>
          <span>Google</span>
        </button>
      </form>

      <div class="mt-8 text-center text-[13px] text-slate-500">
        Don't have an account? 
        <button
          type="button"
          id="switch-to-signup-link"
          class="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer ml-1"
        >
          Sign up
        </button>
      </div>
    </div>
    `;
}

function renderSignUpCard() {
    return `
    <div class="animate-in fade-in duration-200">
      <div class="flex flex-col items-center text-center mb-6">
        <div class="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-black/20">
          <i data-lucide="user-plus" class="w-6 h-6 text-white"></i>
        </div>
        <h1 class="text-2xl font-bold text-[#111827] tracking-tight mb-1">
          Create Account
        </h1>
        <p class="text-[12px] text-slate-500 font-medium">
          Register your resident profile
        </p>
      </div>

      <div id="signup-error-box" class="hidden mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
        <i data-lucide="alert-circle" class="w-4 h-4 shrink-0"></i>
        <span id="signup-error-text"></span>
      </div>

      <div id="signup-success-box" class="hidden mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
        <i data-lucide="check-circle-2" class="w-4 h-4 shrink-0"></i>
        <span id="signup-success-text"></span>
      </div>

      <form id="sign-up-form" class="space-y-4 max-h-[60dvh] sm:max-h-[65dvh] overflow-y-auto pr-1">
        <!-- Profile Photo Selection -->
        <div class="bg-slate-50 border border-slate-200/90 rounded-2xl p-3">
          <div class="flex items-center gap-3">
            <div class="relative group shrink-0">
              <img
                id="signup-avatar-img"
                src="${selectedAvatarUrl}"
                alt="Profile Preview"
                class="w-12 h-12 rounded-full object-cover border-2 border-black shadow-sm"
              />
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <label class="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Photo</label>
                <button
                  type="button"
                  id="toggle-presets-btn"
                  class="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  ${showPresetsGrid ? 'Hide Presets' : 'Presets'}
                </button>
              </div>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-[11px] text-slate-500">Select avatar</span>
              </div>
            </div>
          </div>

          ${showPresetsGrid ? `
            <div class="mt-3 pt-3 border-t border-slate-200 grid grid-cols-4 gap-2">
              ${DEFAULT_AVATARS.map(av => `
                <button
                  type="button"
                  data-avatar="${av.url}"
                  class="preset-avatar-btn p-0.5 rounded-lg border-2 transition-all cursor-pointer ${selectedAvatarUrl === av.url ? 'border-black scale-105 shadow' : 'border-transparent hover:border-slate-300'}"
                >
                  <img src="${av.url}" alt="${av.label}" class="w-full aspect-square rounded-md object-cover" />
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <div>
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
          <input
            id="signup-fullname"
            type="text"
            required
            placeholder="e.g. Sivanaresh R"
            class="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <div>
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Flat / Unit Number</label>
          <select
            id="signup-flat"
            required
            class="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">Select Flat...</option>
            ${AVAILABLE_FLATS.map(f => `<option value="${f}">${f}</option>`).join('')}
          </select>
        </div>

        <div>
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Username</label>
          <input
            id="signup-username"
            type="text"
            required
            placeholder="e.g. siva_f01"
            class="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <div>
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
          <input
            id="signup-email"
            type="email"
            required
            placeholder="tenant@chemadura.com"
            class="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <div>
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
          <input
            id="signup-phone"
            type="tel"
            placeholder="+91 98421 00000"
            class="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Password</label>
            <input
              id="signup-password"
              type="password"
              required
              placeholder="••••••••"
              class="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Confirm</label>
            <input
              id="signup-confirm-password"
              type="password"
              required
              placeholder="••••••••"
              class="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        <div>
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Assigned Role</label>
          <select
            id="signup-role"
            class="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="TENANT">TENANT (Standard Resident)</option>
            <option value="ADMIN_TENANT">ADMIN_TENANT (Delegate Manager)</option>
            <option value="OWNER">OWNER (Superadmin Property Authority)</option>
          </select>
        </div>

        <button
          type="submit"
          id="sign-up-btn"
          class="w-full py-3.5 px-4 rounded-xl bg-[#0a0a0a] hover:bg-black active:bg-black text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-md mt-4 cursor-pointer"
        >
          <span>Register Profile</span>
          <i data-lucide="check" class="w-4 h-4"></i>
        </button>
      </form>

      <div class="mt-4 text-center text-[13px] text-slate-500">
        Already have an account? 
        <button
          type="button"
          id="switch-to-login-link"
          class="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer ml-1"
        >
          Log in
        </button>
      </div>
    </div>
    `;
}

function attachSignInEvents() {
    const togglePwdBtn = document.getElementById('toggle-pwd-btn');
    if (togglePwdBtn) {
        togglePwdBtn.addEventListener('click', () => {
            isPasswordVisible = !isPasswordVisible;
            const input = document.getElementById('login-password');
            if (input) input.type = isPasswordVisible ? 'text' : 'password';
            const icon = togglePwdBtn.querySelector('i');
            if (icon) {
                icon.setAttribute('data-lucide', isPasswordVisible ? 'eye-off' : 'eye');
                if (window.lucide) window.lucide.createIcons();
            }
        });
    }

    const switchLink = document.getElementById('switch-to-signup-link');
    if (switchLink) {
        switchLink.addEventListener('click', () => {
            currentAuthMode = 'signup';
            renderLogin();
        });
    }

    const form = document.getElementById('sign-in-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('login-identifier').value.trim();
            const pass = document.getElementById('login-password').value;
            const btn = document.getElementById('sign-in-btn');
            const errBox = document.getElementById('login-error-box');
            const errText = document.getElementById('login-error-text');

            if (errBox) errBox.classList.add('hidden');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>Authenticating...</span>';
            }

            const res = await window.authService.login(id, pass);
            if (res.success) {
                if (typeof window.loadGlobalData === 'function') await window.loadGlobalData();
                window.location.hash = '#/';
            } else {
                if (errText) errText.textContent = res.error || 'Invalid credentials. Please try again.';
                if (errBox) errBox.classList.remove('hidden');
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<span>Sign In</span><i data-lucide="arrow-right" class="w-4 h-4"></i>';
                    if (window.lucide) window.lucide.createIcons();
                }
            }
        });
    }

    const googleBtn = document.getElementById('google-sign-in-btn');
    if (googleBtn) {
        googleBtn.addEventListener('click', () => {
            const errBox = document.getElementById('login-error-box');
            const errText = document.getElementById('login-error-text');
            if (errBox && errText) {
                errText.textContent = 'Google SSO domain integration is active for @chemadura.com accounts.';
                errBox.className = 'mb-5 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-700 flex items-center gap-2';
                errBox.classList.remove('hidden');
            }
        });
    }
}

function attachSignUpEvents() {
    const switchLink = document.getElementById('switch-to-login-link');
    if (switchLink) {
        switchLink.addEventListener('click', () => {
            currentAuthMode = 'login';
            renderLogin();
        });
    }

    const presetsBtn = document.getElementById('toggle-presets-btn');
    if (presetsBtn) {
        presetsBtn.addEventListener('click', () => {
            showPresetsGrid = !showPresetsGrid;
            renderLogin();
        });
    }

    document.querySelectorAll('.preset-avatar-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const url = btn.getAttribute('data-avatar');
            if (url) {
                selectedAvatarUrl = url;
                showPresetsGrid = false;
                renderLogin();
            }
        });
    });

    const form = document.getElementById('sign-up-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = document.getElementById('signup-fullname').value.trim();
            const flatNumber = document.getElementById('signup-flat').value;
            const username = document.getElementById('signup-username').value.trim();
            const email = document.getElementById('signup-email').value.trim();
            const phone = document.getElementById('signup-phone').value.trim() || '+91 98421 00000';
            const password = document.getElementById('signup-password').value;
            const confirm = document.getElementById('signup-confirm-password').value;
            const role = document.getElementById('signup-role').value;
            const errBox = document.getElementById('signup-error-box');
            const errText = document.getElementById('signup-error-text');
            const btn = document.getElementById('sign-up-btn');

            if (errBox) errBox.classList.add('hidden');

            if (password !== confirm) {
                if (errText) errText.textContent = 'Passwords do not match.';
                if (errBox) errBox.classList.remove('hidden');
                return;
            }

            if (password.length < 6) {
                if (errText) errText.textContent = 'Password must be at least 6 characters long.';
                if (errBox) errBox.classList.remove('hidden');
                return;
            }

            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>Creating Account...</span>';
            }

            const sb = window.supabase || window.appSupabase;
            try {
                // 1. Auth signup
                const signUpRes = await window.authService.signUp(email, password, {
                    full_name: fullName,
                    flat_number: flatNumber,
                    username: username
                });

                // 2. Insert into public.users table
                const authId = signUpRes.user?.id || null;
                const { error: dbError } = await sb.from('users').insert({
                    auth_id: authId,
                    email: email,
                    username: username,
                    full_name: fullName,
                    flat_number: flatNumber,
                    phone: phone,
                    role: role,
                    avatar_url: selectedAvatarUrl,
                    password: password,
                    occupancy_status: 'active',
                    payment_status: 'pending'
                });

                if (dbError) {
                    console.warn("User profile insert warning:", dbError.message);
                }

                const successBox = document.getElementById('signup-success-box');
                const successText = document.getElementById('signup-success-text');
                if (successBox && successText) {
                    successText.textContent = 'Account created successfully! Signing you in...';
                    successBox.classList.remove('hidden');
                }
                await window.authService.login(email, password);
                if (typeof window.loadGlobalData === 'function') await window.loadGlobalData();
                window.location.hash = '#/';
            } catch (err) {
                if (errText) errText.textContent = err.message || 'Registration failed';
                if (errBox) errBox.classList.remove('hidden');
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<span>Register Profile</span><i data-lucide="check" class="w-4 h-4"></i>';
                }
            }
        });
    }
}

window.renderLogin = renderLogin;
