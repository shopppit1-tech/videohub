import { useEffect, useState } from "react";
import { ArrowRight, Check, CircleHelp, Facebook, Link2, LockKeyhole, Plus, ShieldCheck, Trash2, UserRound, X } from "lucide-react";

type MetaLoginResponse = {
  authResponse?: {
    accessToken: string;
    userID: string;
    expiresIn: number;
  };
  status?: string;
};

type MetaSdk = {
  init: (options: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void;
  login: (callback: (response: MetaLoginResponse) => void, options: { scope: string }) => void;
};

declare global {
  interface Window {
    FB?: MetaSdk;
    fbAsyncInit?: () => void;
  }
}

type ConnectedAccount = {
  id: string;
  userId: string;
  accessToken: string;
  expiresAt: number;
  connectedAt: number;
};

const APP_ID = (import.meta.env.VITE_META_APP_ID as string | undefined)?.trim() ?? "";
const STORAGE_KEY = "videohub.meta-accounts.v1";
const MAX_ACCOUNTS = 9;

function loadAccounts(): ConnectedAccount[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((account): account is ConnectedAccount =>
      Boolean(account && typeof account.id === "string" && typeof account.userId === "string" &&
        typeof account.accessToken === "string" && typeof account.expiresAt === "number" &&
        typeof account.connectedAt === "number"),
    ).slice(0, MAX_ACCOUNTS);
  } catch {
    return [];
  }
}

export default function Home() {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [activeId, setActiveId] = useState("");
  const [sdkReady, setSdkReady] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = loadAccounts();
    setAccounts(saved);
    setActiveId(localStorage.getItem(`${STORAGE_KEY}.active`) ?? saved[0]?.id ?? "");
  }, []);

  useEffect(() => {
    if (!APP_ID) return;
    if (window.FB) {
      window.FB.init({ appId: APP_ID, cookie: false, xfbml: false, version: "v24.0" });
      setSdkReady(true);
      return;
    }
    window.fbAsyncInit = () => {
      window.FB?.init({ appId: APP_ID, cookie: false, xfbml: false, version: "v24.0" });
      setSdkReady(Boolean(window.FB));
    };
    if (!document.getElementById("facebook-jssdk")) {
      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.onerror = () => setError("SDK Meta gagal dimuat. Periksa koneksi internet dan pemblokir konten.");
      document.head.appendChild(script);
    }
  }, []);

  const save = (next: ConnectedAccount[], selected = activeId) => {
    setAccounts(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (selected) {
      setActiveId(selected);
      localStorage.setItem(`${STORAGE_KEY}.active`, selected);
    } else {
      setActiveId("");
      localStorage.removeItem(`${STORAGE_KEY}.active`);
    }
  };

  const connectAccount = () => {
    setError("");
    setNotice("");
    if (!APP_ID) {
      setError("Meta App ID belum dikonfigurasi. Tambahkan VITE_META_APP_ID di pengaturan build Cloudflare Pages.");
      return;
    }
    if (!window.FB) {
      setError("Login Meta masih disiapkan. Coba lagi sebentar.");
      return;
    }
    if (accounts.length >= MAX_ACCOUNTS) {
      setError("Maksimal sembilan akun. Hapus satu slot dahulu jika ingin menambah akun lain.");
      return;
    }
    setBusy(true);
    window.FB.login((response) => {
      setBusy(false);
      const auth = response.authResponse;
      if (!auth?.accessToken || !auth.userID) {
        setError("Login dibatalkan atau Meta tidak memberikan izin login. Tidak ada password yang disimpan.");
        return;
      }
      const existing = accounts.find((account) => account.userId === auth.userID);
      const account: ConnectedAccount = {
        id: existing?.id ?? crypto.randomUUID(),
        userId: auth.userID,
        accessToken: auth.accessToken,
        expiresAt: Date.now() + auth.expiresIn * 1000,
        connectedAt: existing?.connectedAt ?? Date.now(),
      };
      const next = existing
        ? accounts.map((item) => item.userId === auth.userID ? account : item)
        : [...accounts, account];
      save(next, account.id);
      setNotice(existing ? "Akun ini sudah ada; izin Meta diperbarui." : `Akun ditambahkan ke slot ${String(next.length).padStart(2, "0")}.`);
    }, { scope: "public_profile" });
  };

  const removeAccount = (id: string) => {
    const next = accounts.filter((account) => account.id !== id);
    const nextActive = activeId === id ? (next[0]?.id ?? "") : activeId;
    save(next, nextActive);
    setNotice("Akun dan token OAuth-nya dihapus dari penyimpanan browser ini.");
  };

  const clearAll = () => {
    save([], "");
    setNotice("Semua akun dan token lokal sudah dihapus.");
  };

  const active = accounts.find((account) => account.id === activeId);

  return (
    <main className="hub-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Video Hub beranda"><span className="brand-mark"><Facebook size={20} fill="currentColor" /></span><span><strong>Video Hub</strong><small>Pengelola akun Meta</small></span></a>
        <div className="topbar-status"><span className={`status-dot ${APP_ID ? (sdkReady ? "ready" : "waiting") : "off"}`} />{APP_ID ? (sdkReady ? "Meta Login siap" : "Menyiapkan login") : "Perlu konfigurasi Meta"}</div>
      </header>

      <section className="intro" id="top">
        <div className="intro-copy"><div className="eyebrow"><span className="eyebrow-line" /> ACCOUNT SWITCHER</div><h1>Sembilan akun.<br /><em>Satu tempat.</em></h1><p>Tambahkan akun melalui jendela login resmi Meta, lalu pilih akun yang ingin digunakan.</p></div>
        <div className="active-panel"><div className="active-panel-top"><span className="active-icon"><UserRound size={19} /></span><span>AKUN TERPILIH</span></div><strong>{active ? `Akun ${String(accounts.findIndex((account) => account.id === active.id) + 1).padStart(2, "0")}` : "Belum dipilih"}</strong><small>{active ? `ID Meta berakhiran ${active.userId.slice(-4)}` : "Pilih atau tambahkan akun"}</small></div>
      </section>

      <section className="account-section">
        <div className="section-head"><div><span className="eyebrow">RUANG AKUN</span><h2>Akun tersimpan <span>{accounts.length}/{MAX_ACCOUNTS}</span></h2></div><button className="add-button" type="button" onClick={connectAccount} disabled={!APP_ID || busy || accounts.length >= MAX_ACCOUNTS}><Plus size={17} />{busy ? "Menghubungkan…" : "Tambah akun"}</button></div>
        {!APP_ID && <div className="setup-hint"><strong>Login belum diaktifkan.</strong> Admin perlu mengisi <code>VITE_META_APP_ID</code> pada Cloudflare Pages dan mendaftarkan domain Pages sebagai domain resmi di Meta Developer.</div>}
        <div className="account-grid">
          {Array.from({ length: MAX_ACCOUNTS }, (_, index) => {
            const account = accounts[index];
            const isActive = Boolean(account && account.id === activeId);
            return account ? (
              <article className={`account-tile ${isActive ? "selected" : ""}`} key={account.id}>
                <button className="account-select" type="button" onClick={() => { setActiveId(account.id); localStorage.setItem(`${STORAGE_KEY}.active`, account.id); }} aria-pressed={isActive}>
                  <span className="slot-number">{String(index + 1).padStart(2, "0")}</span><span className="account-avatar"><UserRound size={19} /></span><span className="account-details"><strong>Akun {String(index + 1).padStart(2, "0")}</strong><small>ID {account.userId.slice(0, 4)}••••{account.userId.slice(-4)}</small></span>{isActive ? <span className="selected-check"><Check size={15} /></span> : <ArrowRight className="tile-arrow" size={16} />}
                </button>
                <div className="tile-footer"><span><span className="tiny-dot" />{account.expiresAt > Date.now() ? "Terhubung" : "Token kedaluwarsa"}</span><button type="button" onClick={() => removeAccount(account.id)} aria-label={`Hapus akun ${index + 1}`}><Trash2 size={14} /></button></div>
              </article>
            ) : (
              <button className="account-tile empty-tile" key={`empty-${index}`} type="button" onClick={connectAccount} disabled={!APP_ID || busy}>
                <span className="slot-number">{String(index + 1).padStart(2, "0")}</span><span className="plus-ring"><Plus size={18} /></span><span className="empty-label">Tambah akun</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="privacy-card"><span className="privacy-icon"><ShieldCheck size={19} /></span><div><strong>Login resmi, tanpa password tersimpan</strong><p>Login ditangani Meta. Video Hub tidak meminta atau menyimpan password. Token OAuth disimpan hanya di browser/perangkat ini untuk mempertahankan daftar akun; token tidak dikirim ke server Video Hub.</p></div></section>
      <div className="limits-note"><CircleHelp size={16} /><p>Ini adalah account switcher berbasis izin Meta, bukan sembilan sesi Chrome atau sembilan tampilan penuh Facebook. Meta dapat meminta verifikasi ulang. Untuk menambah akun berbeda, pastikan dialog login Meta menawarkan akun yang dimaksud.</p></div>

      {(error || notice) && <div className={`feedback ${error ? "error" : "success"}`} role="status">{error ? <X size={16} /> : <Check size={16} />}<span>{error || notice}</span><button type="button" onClick={() => { setError(""); setNotice(""); }} aria-label="Tutup"><X size={14} /></button></div>}
      <footer className="footer"><span><LockKeyhole size={13} /> Password tidak pernah masuk ke Video Hub</span><button type="button" onClick={clearAll} disabled={!accounts.length}>Hapus semua data lokal</button></footer>
    </main>
  );
}
