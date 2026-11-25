import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  CirclePlay,
  FileVideo,
  Globe2,
  Home as HomeIcon,
  Link2,
  LogIn,
  LogOut,
  Menu,
  RefreshCw,
  Settings,
  ShieldCheck,
  UserRound,
  UsersRound,
  Video,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const tabs = [
  { id: "home", label: "Beranda", icon: HomeIcon },
  { id: "accounts", label: "Akun", icon: UsersRound },
  { id: "videos", label: "Video", icon: Video },
  { id: "settings", label: "Pengaturan", icon: Settings },
] as const;

type TabId = (typeof tabs)[number]["id"];

const startGoogleLogin = () => {
  window.location.href = "/api/google/connect";
};

function Initials({ value }: { value: string }) {
  const initials = value.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  return <span className="avatar-fallback">{initials || "M"}</span>;
}

export default function Home() {
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const accountsQuery = trpc.meta.accounts.useQuery(undefined, {
    enabled: auth.isAuthenticated,
    retry: false,
  });
  const accountIds = useMemo(() => (accountsQuery.data ?? []).map(account => account.pageId), [accountsQuery.data]);
  const videosQuery = trpc.meta.videos.useQuery({ pageIds: accountIds }, {
    enabled: auth.isAuthenticated && accountIds.length > 0,
    retry: false,
  });
  const metaStatus = trpc.meta.status.useQuery();
  const disconnect = trpc.meta.disconnect.useMutation({
    onSuccess: async () => {
      await accountsQuery.refetch();
      await videosQuery.refetch();
      toast.success("Koneksi Meta diputuskan.");
    },
    onError: error => toast.error(error.message),
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("meta_error");
    const googleError = params.get("google_error");
    if (error) {
      toast.error(decodeURIComponent(error));
      window.history.replaceState({}, "", "/");
    }
    if (googleError) {
      toast.error(decodeURIComponent(googleError));
      window.history.replaceState({}, "", "/");
    }
    if (params.get("google") === "connected") {
      toast.success("Login Google berhasil.");
      window.history.replaceState({}, "", "/");
      void auth.refresh();
    }
    if (params.get("meta") === "connected") {
      toast.success("Meta berhasil terhubung.");
      window.history.replaceState({}, "", "/");
      void accountsQuery.refetch();
    }
  }, []);

  const accounts = accountsQuery.data ?? [];
  const videos = videosQuery.data ?? [];
  const goTo = (tab: TabId) => {
    setActiveTab(tab);
    setMobileNavOpen(false);
  };
  const connectMeta = () => {
    if (!auth.isAuthenticated) {
      startGoogleLogin();
      return;
    }
    window.location.href = "/api/meta/connect";
  };
  const playVideo = (url: string | null) => {
    if (!url) {
      toast.error("Meta tidak memberikan tautan pemutaran untuk video ini.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (auth.loading) {
    return <div className="loading-screen"><RefreshCw className="animate-spin" size={20} /> Memeriksa sesi...</div>;
  }

  return (
    <div className="app-shell">
      <aside className={`side-nav ${mobileNavOpen ? "is-open" : ""}`}>
        <div className="brand-block">
          <div className="brand-mark"><CirclePlay size={20} fill="currentColor" /></div>
          <div><strong>Video Hub</strong><span>Control center</span></div>
          <button className="close-nav" onClick={() => setMobileNavOpen(false)} aria-label="Tutup menu"><X size={18} /></button>
        </div>
        <div className="workspace-pill"><span className="status-dot" /> {auth.user ? "Workspace aktif" : "Mode terbatas"}</div>
        <nav className="nav-list" aria-label="Navigasi utama">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return <button key={tab.id} className={`nav-item ${activeTab === tab.id ? "active" : ""}`} onClick={() => goTo(tab.id)}><Icon size={18} /><span>{tab.label}</span>{tab.id === "accounts" && accounts.length > 0 && <em>{accounts.length}</em>}</button>;
          })}
        </nav>
        <div className="nav-footer">
          <div className="safe-note"><ShieldCheck size={16} /><span>Token disimpan aman di server</span></div>
          {auth.user ? <button className="logout-button" onClick={() => void auth.logout()}><LogOut size={16} /> Keluar</button> : <button className="logout-button" onClick={() => startGoogleLogin()}><LogIn size={16} /> Masuk dengan Google</button>}
        </div>
      </aside>
      {mobileNavOpen && <button className="nav-backdrop" onClick={() => setMobileNavOpen(false)} aria-label="Tutup menu" />}

      <main className="main-content">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMobileNavOpen(true)} aria-label="Buka menu"><Menu size={20} /></button>
          <div className="topbar-copy"><span className="eyebrow">{activeTab === "home" ? "Overview" : tabs.find(tab => tab.id === activeTab)?.label}</span><h1>{activeTab === "home" ? "Dashboard" : tabs.find(tab => tab.id === activeTab)?.label}</h1></div>
          <div className="topbar-actions">
            {auth.user ? <div className="user-chip"><div className="user-avatar"><Initials value={auth.user.name || auth.user.email || "User"} /></div><span>{auth.user.name || "Pengguna"}</span></div> : <Button className="small-action" onClick={() => startGoogleLogin()}><LogIn size={16} /> Masuk Google</Button>}
          </div>
        </header>

        {activeTab === "settings" ? <SettingsPanel configured={Boolean(metaStatus.data?.configured)} onDisconnect={() => disconnect.mutate()} disconnecting={disconnect.isPending} /> : activeTab === "accounts" ? <AccountsPanel accounts={accounts} isAuthenticated={auth.isAuthenticated} configured={Boolean(metaStatus.data?.configured)} onConnect={connectMeta} loading={accountsQuery.isLoading} /> : activeTab === "videos" ? <VideosPanel videos={videos} accounts={accounts} isAuthenticated={auth.isAuthenticated} configured={Boolean(metaStatus.data?.configured)} onConnect={connectMeta} loading={videosQuery.isLoading} onPlay={playVideo} /> : <ShortcutPanel onNavigate={goTo} />}
      </main>
    </div>
  );
}

function ShortcutPanel({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const openFacebook = () => window.open("https://www.facebook.com/", "_blank", "noopener,noreferrer");
  const shortcuts = Array.from({ length: 9 }, (_, index) => index + 1);
  return <div className="page-body">
    <section className="hero-card shortcut-hero"><div className="hero-glow" /><div className="hero-content"><span className="kicker">BROWSER SHORTCUTS</span><h2>Buka Facebook asli dari satu tempat.</h2><p>Pilih salah satu pintasan di bawah. Facebook dibuka di browser resmi; aplikasi ini tidak menyimpan password atau membuat halaman login tiruan.</p><div className="hero-actions"><Button className="primary-action" onClick={openFacebook}><Globe2 size={17} /> Buka Facebook di Chrome</Button><span className="security-label"><ShieldCheck size={15} /> Login langsung di browser</span></div></div><div className="hero-orbit"><Globe2 size={42} /><span>External browser</span></div></section>
    <section className="section-block"><SectionHeading title="9 pintasan akun" subtitle="Setiap tombol membuka Facebook resmi di browser" action="Lihat video" onClick={() => onNavigate("videos")} /><div className="shortcut-grid">{shortcuts.map(number => <button className="shortcut-card" key={number} onClick={openFacebook}><div className="shortcut-number">{String(number).padStart(2, "0")}</div><div className="shortcut-copy"><strong>Akun {String(number).padStart(2, "0")}</strong><span>Buka Facebook di Chrome</span></div><ArrowUpRight size={18} /></button>)}</div></section>
    <div className="browser-note"><Globe2 size={17} /><div><strong>Catatan browser</strong><span>Chrome biasa dapat memakai sesi yang sama. Untuk akun berbeda, gunakan profil Chrome, mode Tamu, atau browser terpisah secara manual.</span></div></div>
  </div>;
}

function DashboardPanel({ auth, accounts, videos, configured, onConnect, loading, onNavigate, onPlay }: any) {
  return <div className="page-body">
    <section className="hero-card"><div className="hero-glow" /><div className="hero-content"><span className="kicker">MEDIA WORKSPACE</span><h2>Kelola sumber video resmi Anda.</h2><p>Hubungkan Page Meta, lihat video yang benar-benar diizinkan, lalu pilih dan putar secara manual.</p><div className="hero-actions"><Button className="primary-action" onClick={onConnect}>{auth.isAuthenticated ? <><Link2 size={17} /> Hubungkan Meta</> : <><LogIn size={17} /> Masuk dengan Google</>}</Button><span className="security-label"><ShieldCheck size={15} /> Tanpa menyimpan password</span></div></div><div className="hero-orbit"><CirclePlay size={42} fill="currentColor" /><span>Manual play</span></div></section>
    <section className="metrics-row"><Metric label="Page terhubung" value={`${accounts.length}/9`} icon={<UsersRound size={17} />} tone="blue" /><Metric label="Video tersedia" value={`${videos.length}/9`} icon={<FileVideo size={17} />} tone="violet" /><Metric label="Status koneksi" value={configured ? (accounts.length ? "Aktif" : "Siap") : "Belum siap"} icon={configured ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />} tone={configured ? "green" : "amber"} /></section>
    <section className="section-block"><SectionHeading title="Page terhubung" subtitle="Maksimal 9 sumber yang Anda izinkan" action="Lihat semua" onClick={() => onNavigate("accounts")} />{loading ? <SkeletonGrid count={3} /> : accounts.length === 0 ? <EmptyState icon={<UsersRound size={24} />} title={auth.isAuthenticated ? "Belum ada Page terhubung" : "Masuk untuk menghubungkan Meta"} description={configured ? "Tekan tombol Hubungkan Meta untuk mengambil Page yang tersedia bagi akun Anda." : "Admin proyek perlu mengatur Meta App ID dan App Secret terlebih dahulu."} action={configured ? "Hubungkan Meta" : undefined} onAction={onConnect} /> : <AccountGrid accounts={accounts.slice(0, 3)} />}</section>
    <section className="section-block"><SectionHeading title="Video terbaru" subtitle="Data langsung dari sumber yang terhubung" action="Lihat semua" onClick={() => onNavigate("videos")} />{loading ? <SkeletonGrid count={3} /> : videos.length === 0 ? <EmptyState icon={<Video size={24} />} title="Belum ada video yang tersedia" description="Setelah Page terhubung dan izin Meta tersedia, video akan muncul di sini." /> : <VideoGrid videos={videos.slice(0, 3)} onPlay={onPlay} />}</section>
  </div>;
}

function Metric({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone: string }) { return <div className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div>; }
function SectionHeading({ title, subtitle, action, onClick }: { title: string; subtitle: string; action?: string; onClick?: () => void }) { return <div className="section-heading"><div><h3>{title}</h3><p>{subtitle}</p></div>{action && <button className="text-action" onClick={onClick}>{action}<ChevronRight size={15} /></button>}</div>; }
function AccountsPanel({ accounts, isAuthenticated, configured, onConnect, loading }: any) { return <div className="page-body"><PageIntro icon={<UsersRound size={20} />} title="Akun & Page" description="Sumber yang benar-benar terhubung melalui izin resmi Meta." action={<Button className="primary-action" onClick={onConnect}><Link2 size={16} /> Hubungkan Meta</Button>} />{loading ? <SkeletonGrid count={6} /> : accounts.length === 0 ? <EmptyState icon={<UsersRound size={24} />} title={isAuthenticated ? "Belum ada Page terhubung" : "Masuk terlebih dahulu"} description={configured ? "Aplikasi akan menampilkan Page yang dapat diakses oleh akun Meta Anda." : "Konfigurasi Meta OAuth belum tersedia di server."} action={configured ? "Hubungkan Meta" : undefined} onAction={onConnect} /> : <AccountGrid accounts={accounts} />}</div>; }
function VideosPanel({ videos, accounts, isAuthenticated, configured, onConnect, loading, onPlay }: any) { return <div className="page-body"><PageIntro icon={<Video size={20} />} title="Video" description="Maksimal 9 video dari Page yang sudah Anda izinkan. Pemutaran selalu manual." action={<Button className="primary-action" onClick={onConnect}><Link2 size={16} /> Kelola koneksi</Button>} />{loading ? <SkeletonGrid count={6} /> : videos.length === 0 ? <EmptyState icon={<Video size={24} />} title={isAuthenticated && accounts.length ? "Belum ada video yang tersedia" : "Belum ada sumber video"} description={configured ? "Hubungkan Page dan pastikan permission video tersedia di Meta App Anda." : "Meta OAuth belum dikonfigurasi di server."} action={configured ? "Hubungkan Meta" : undefined} onAction={onConnect} /> : <VideoGrid videos={videos} onPlay={onPlay} />}</div>; }
function SettingsPanel({ configured, onDisconnect, disconnecting }: any) { return <div className="page-body"><PageIntro icon={<Settings size={20} />} title="Pengaturan" description="Kelola koneksi dan keamanan workspace Anda." /><div className="settings-card"><div className="settings-row"><div className="settings-icon"><ShieldCheck size={18} /></div><div><strong>OAuth Meta</strong><span>{configured ? "Server siap menerima koneksi resmi Meta." : "Menunggu META_APP_ID dan META_APP_SECRET."}</span></div><span className={`status-badge ${configured ? "success" : "warning"}`}>{configured ? "Siap" : "Belum siap"}</span></div><div className="settings-row"><div className="settings-icon"><LogOut size={18} /></div><div><strong>Putuskan semua koneksi</strong><span>Hapus token dan Page tersimpan dari workspace ini.</span></div><Button variant="outline" onClick={onDisconnect} disabled={disconnecting}>{disconnecting ? "Memproses..." : "Putuskan"}</Button></div></div></div>; }
function PageIntro({ icon, title, description, action }: any) { return <div className="page-intro"><div className="intro-icon">{icon}</div><div><h2>{title}</h2><p>{description}</p></div>{action && <div className="intro-action">{action}</div>}</div>; }
function EmptyState({ icon, title, description, action, onAction }: any) { return <div className="empty-state"><div className="empty-icon">{icon}</div><h3>{title}</h3><p>{description}</p>{action && <Button variant="outline" onClick={onAction}>{action}<ArrowUpRight size={15} /></Button>}</div>; }
function AccountGrid({ accounts }: any) { return <div className="account-grid">{accounts.slice(0, 9).map((account: any) => <div className="account-card" key={account.pageId}><div className="account-avatar">{account.pictureUrl ? <img src={account.pictureUrl} alt="" /> : <Initials value={account.pageName} />}</div><div className="account-card-copy"><strong>{account.pageName}</strong><span>{account.category || "Meta Page"}</span><small><span className="status-dot" /> Terhubung</small></div><ChevronRight size={17} className="muted-icon" /></div>)}</div>; }
function VideoGrid({ videos, onPlay }: any) { return <div className="video-grid">{videos.slice(0, 9).map((video: any) => <article className="video-card" key={`${video.pageId}-${video.id}`}><div className="video-thumb">{video.picture ? <img src={video.picture} alt="" /> : <div className="thumb-fallback"><FileVideo size={28} /></div>}<button className="play-button" onClick={() => onPlay(video.permalinkUrl)} aria-label={`Buka ${video.title}`}><CirclePlay size={25} fill="currentColor" /></button></div><div className="video-card-body"><span className="video-source">{video.pageName}</span><h4>{video.title}</h4><button className="open-video" onClick={() => onPlay(video.permalinkUrl)}>Buka video resmi <ArrowUpRight size={14} /></button></div></article>)}</div>; }
function SkeletonGrid({ count }: { count: number }) { return <div className="skeleton-grid">{Array.from({ length: count }).map((_, index) => <div className="skeleton-card" key={index} />)}</div>; }
