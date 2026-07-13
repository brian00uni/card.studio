"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Avatar, Box, Button, Card, CardContent, Checkbox, Chip, CssBaseline, Dialog, DialogContent, DialogTitle, Divider, Drawer,
  FormControl, FormControlLabel, IconButton, InputLabel, LinearProgress, List, ListItemButton,
  MenuItem, Paper, Select, Stack, Tab, Tabs, TextField, ThemeProvider,
  Tooltip, Typography, createTheme,
} from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import CollectionsRoundedIcon from "@mui/icons-material/CollectionsRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

const drawerWidth = 280;

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#6366f1", dark: "#4f46e5" },
    error: { main: "#d71920" },
    success: { main: "#10b981" },
    background: { default: "#f8fafc", paper: "#ffffff" },
    text: { primary: "#111827", secondary: "#667085" },
    divider: "#e6e8ec",
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Pretendard", "Apple SD Gothic Neo", sans-serif',
    h4: { fontWeight: 800, letterSpacing: "-0.035em" },
    h5: { fontWeight: 800, letterSpacing: "-0.03em" },
    h6: { fontWeight: 800, letterSpacing: "-0.025em" },
    button: { fontWeight: 750, letterSpacing: "-0.01em" },
  },
  components: {
    MuiButton: { styleOverrides: { root: { boxShadow: "none", textTransform: "none" } } },
    MuiCard: { styleOverrides: { root: { border: "1px solid #e6e8ec", boxShadow: "0 1px 2px rgba(16,24,40,.04)" } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 750 } } },
    MuiTabs: { styleOverrides: { indicator: { height: 3, borderRadius: 3 } } },
  },
});

const cards = [
  ["01", "표지", "/reference/01-cover-approved-style.png"],
  ["02", "긴급전화", "/reference/02-phone-approved-style.png"],
  ["03", "병원", "/reference/03-hospital-approved-style.png"],
  ["04", "현지 도움", "/reference/04-community-approved-style.png"],
  ["05", "보여주기", "/reference/05-phrases-approved-style.png"],
  ["06", "약품", "/reference/06-medicine-approved-style.png"],
  ["07", "요약", "/reference/07-summary-approved-style.png"],
] as const;

const fallbackQueue = [
  ["오사카", "일본", "검수 준비", "오늘 06:42"],
  ["다낭", "베트남", "대기", "내일 06:00"],
  ["나트랑", "베트남", "대기", "순서 3"],
] as const;

type Project = {
  id: string;
  order_index: number;
  country: string;
  city: string;
  slug: string;
  status: string;
  run_date: string | null;
  current_version: number;
};

type ProjectDetail = {
  version: null | {
    version: number;
    sources: Array<{ title?: string; url?: string; publisher?: string; grade?: string; supports?: string }>;
    qa_report: { passed?: string[]; blockers?: string[]; warnings?: string[]; humanReviewRequired?: string[] };
  };
  assets: Array<{ id: string; category: string; local_product_name?: string; source_url: string; approval_status: string; storage_path?: string | null }>;
};

const statusLabel: Record<string, string> = {
  queued: "대기",
  researching: "조사 중",
  needs_review: "검수 필요",
  needs_asset: "약품 사진 승인 필요",
  revision_requested: "수정 요청",
  approved: "승인",
  rendering: "PNG 생성 중",
  completed: "완료",
  failed: "오류",
};

const checks = [
  ["HTML 카드 7장", true], ["@gaseongbi_crew 표기", true],
  ["외부 폰트 요청 없음", true], ["공식 전화번호 검증", false],
  ["실제 약품 이미지 승인", false], ["현지어 사람 검수", false],
] as const;

const defaultPrompt = `topics.csv에서 상태가 대기인 첫 도시를 선택한다.
공식 기관과 제조사 자료를 우선해 최신 정보를 조사한다.
인터넷 이미지는 출처와 사용 조건을 기록하고 로컬 사본으로 저장한다.
HTML 카드 7장, sources.md, image-sources.md, qa-report.md를 생성한다.
샘플 문구나 확인되지 않은 정보가 있으면 REVIEW_READY로 전환하지 않는다.`;

const navItems = [
  ["대시보드", <DashboardRoundedIcon key="dashboard" />],
  ["카드 프로젝트", <CollectionsRoundedIcon key="cards" />],
  ["자동화", <AutoAwesomeRoundedIcon key="auto" />],
  ["검수 기록", <FactCheckRoundedIcon key="review" />],
  ["출처 관리", <LinkRoundedIcon key="links" />],
] as const;

export default function Home() {
  const [selected, setSelected] = useState(0);
  const [tab, setTab] = useState(0);
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [saved, setSaved] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [backendNotice, setBackendNotice] = useState<string | null>(null);
  const [projectDetail, setProjectDetail] = useState<ProjectDetail | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [reviewPrompt, setReviewPrompt] = useState("실제 조사 데이터로 교체한 뒤 전화번호와 이미지 출처를 다시 확인해주세요.");
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);
  const [assetForm, setAssetForm] = useState({ category: "", localProductName: "", koreanProductName: "", productPageUrl: "", imageUrl: "", usageNote: "" });
  const [assetSaving, setAssetSaving] = useState(false);
  const [assetMessage, setAssetMessage] = useState<string | null>(null);
  const [approveAssetId, setApproveAssetId] = useState<string | null>(null);
  const [confirmProductMatch, setConfirmProductMatch] = useState(false);
  const [confirmUsageRights, setConfirmUsageRights] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("card-studio-prompt");
    if (stored) queueMicrotask(() => setPrompt(stored));
    fetch("/api/projects")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "프로젝트 목록을 불러오지 못했습니다.");
        setProjects(payload.projects || []);
      })
      .catch(() => setBackendNotice("Supabase 마이그레이션 적용 전에는 디자인 샘플만 표시됩니다."));
    fetch("/api/auth/session")
      .then((response) => response.json())
      .then((payload) => setAuthenticated(Boolean(payload.authenticated)))
      .catch(() => setAuthenticated(false));
  }, []);

  const passed = useMemo(() => checks.filter(([, ok]) => ok).length, []);
  const activeProject = projects[0];
  const projectQueue = projects.length
    ? projects.slice(0, 5).map((project) => [project.city, project.country, statusLabel[project.status] || project.status] as const)
    : fallbackQueue;
  const liveSources = projectDetail?.version?.sources || [];
  const liveQa = projectDetail?.version?.qa_report;

  useEffect(() => {
    if (!activeProject?.slug) return;
    fetch(`/api/projects/${activeProject.slug}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "상세 데이터를 불러오지 못했습니다.");
        setProjectDetail(payload);
      })
      .catch(() => setBackendNotice("프로젝트 상세 데이터를 불러오지 못했습니다."));
  }, [activeProject?.slug]);
  const savePrompt = () => {
    window.localStorage.setItem("card-studio-prompt", prompt);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  };
  const login = async () => {
    setLoginError(null);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: adminPassword }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setLoginError(payload.error || "로그인하지 못했습니다.");
      return;
    }
    setAuthenticated(true);
    setAdminPassword("");
    setLoginOpen(false);
  };
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthenticated(false);
  };
  const submitRevision = async () => {
    if (!activeProject) return;
    if (!authenticated) {
      setLoginOpen(true);
      return;
    }
    setReviewSaving(true);
    setReviewMessage(null);
    try {
      const response = await fetch(`/api/projects/${activeProject.slug}/revise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: reviewPrompt, cardNumber: selected + 1 }),
      });
      const payload = await response.json();
      if (response.status === 401) {
        setAuthenticated(false);
        setLoginOpen(true);
        throw new Error("관리자 로그인이 필요합니다.");
      }
      if (!response.ok) throw new Error(payload.error || "수정 요청에 실패했습니다.");
      setReviewMessage(`version ${payload.version}이 생성되었습니다. 다시 검수해주세요.`);
      const detailResponse = await fetch(`/api/projects/${activeProject.slug}`);
      setProjectDetail(await detailResponse.json());
      setProjects((items) => items.map((item) => item.slug === activeProject.slug ? { ...item, current_version: payload.version, status: "needs_review" } : item));
    } catch (error) {
      setReviewMessage(error instanceof Error ? error.message : "수정 요청에 실패했습니다.");
    } finally {
      setReviewSaving(false);
    }
  };
  const refreshProjectDetail = async () => {
    if (!activeProject) return;
    const response = await fetch(`/api/projects/${activeProject.slug}`);
    if (response.ok) setProjectDetail(await response.json());
  };
  const addAssetCandidate = async () => {
    if (!activeProject) return;
    if (!authenticated) { setLoginOpen(true); return; }
    setAssetSaving(true);
    setAssetMessage(null);
    try {
      const response = await fetch(`/api/projects/${activeProject.slug}/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assetForm),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "약품 후보 등록에 실패했습니다.");
      setAssetForm({ category: "", localProductName: "", koreanProductName: "", productPageUrl: "", imageUrl: "", usageNote: "" });
      setAssetMessage("후보가 등록되었습니다. 원문과 실제 패키지를 확인한 뒤 승인하세요.");
      await refreshProjectDetail();
    } catch (error) {
      setAssetMessage(error instanceof Error ? error.message : "약품 후보 등록에 실패했습니다.");
    } finally {
      setAssetSaving(false);
    }
  };
  const approveAndDownloadAsset = async () => {
    if (!approveAssetId) return;
    setAssetSaving(true);
    setAssetMessage(null);
    try {
      const response = await fetch(`/api/assets/${approveAssetId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmProductMatch, confirmUsageRights }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "이미지 승인·다운로드에 실패했습니다.");
      setApproveAssetId(null);
      setConfirmProductMatch(false);
      setConfirmUsageRights(false);
      setAssetMessage("실제 패키지 이미지가 승인되어 비공개 Storage에 저장됐습니다.");
      await refreshProjectDetail();
    } catch (error) {
      setAssetMessage(error instanceof Error ? error.message : "이미지 승인·다운로드에 실패했습니다.");
    } finally {
      setAssetSaving(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Drawer variant="permanent" sx={{ width: drawerWidth, flexShrink: 0, display: { xs: "none", lg: "block" }, "& .MuiDrawer-paper": { width: drawerWidth, bgcolor: "#111827", color: "#d1d5db", border: 0 } }}>
        <Stack sx={{ height: "100%" }}>
          <Stack direction="row" spacing={1.5} sx={{ px: 3, height: 76, alignItems: "center" }}>
            <Avatar variant="rounded" sx={{ bgcolor: "primary.main", width: 40, height: 40, fontWeight: 900 }}>G</Avatar>
            <Box><Typography color="white" fontWeight={850}>Card Studio</Typography><Typography variant="caption" color="#8b95a7">GASEONGBI CREW</Typography></Box>
          </Stack>
          <Divider sx={{ borderColor: "#ffffff12" }} />
          <Box sx={{ px: 2, py: 2.5 }}>
            <Typography variant="overline" sx={{ px: 1.5, color: "#6b7280", fontWeight: 800, letterSpacing: ".13em" }}>WORKSPACE</Typography>
            <List disablePadding sx={{ mt: 1 }}>
              {navItems.map(([label, icon], i) => <ListItemButton key={label} selected={i === 1} sx={{ mb: .5, borderRadius: 1.5, gap: 1.5, color: i === 1 ? "white" : "#9ca3af", "&.Mui-selected": { bgcolor: "#ffffff12", color: "white" }, "&.Mui-selected:hover": { bgcolor: "#ffffff18" }, "& .MuiSvgIcon-root": { fontSize: 20 } }}>{icon}<Typography variant="body2" fontWeight={700}>{label}</Typography></ListItemButton>)}
            </List>
          </Box>
          <Box sx={{ px: 3, mt: 1 }}>
            <Typography variant="overline" sx={{ color: "#6b7280", fontWeight: 800, letterSpacing: ".13em" }}>PRODUCTION QUEUE</Typography>
            <Stack spacing={1} mt={1.5}>{projectQueue.map(([city, country, status], i) => <Paper key={city} elevation={0} sx={{ p: 1.5, bgcolor: i === 0 ? "#ffffff0d" : "transparent", border: "1px solid", borderColor: i === 0 ? "#ffffff18" : "transparent", color: "white" }}><Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}><Box><Typography variant="body2" fontWeight={800}>{city}</Typography><Typography variant="caption" color="#7f8a9d">{country}</Typography></Box><Chip label={status} size="small" sx={{ height: 22, bgcolor: i === 0 ? "#4f46e533" : "#ffffff0a", color: i === 0 ? "#a5b4fc" : "#7f8a9d", fontSize: 10 }} /></Stack></Paper>)}</Stack>
          </Box>
          <Box sx={{ mt: "auto", p: 2.5 }}>
            <Card sx={{ bgcolor: "#ffffff0b", borderColor: "#ffffff14", color: "white" }}><CardContent sx={{ p: "16px !important" }}><Stack direction="row" spacing={1.3}><ScheduleRoundedIcon sx={{ color: "#34d399", fontSize: 20 }} /><Box><Typography variant="caption" color="#8b95a7">다음 자동 생성</Typography><Typography variant="body2" fontWeight={800}>내일 오전 6:00</Typography><Typography variant="caption" color="#8b95a7">오전 7시 전 검수 대기</Typography></Box></Stack></CardContent></Card>
            <Button startIcon={<SettingsRoundedIcon />} fullWidth sx={{ mt: 1.5, color: "#9ca3af", justifyContent: "flex-start" }}>프로젝트 설정</Button>
          </Box>
        </Stack>
      </Drawer>

      <Box component="main" sx={{ ml: { xs: 0, lg: `${drawerWidth}px` }, minHeight: "100vh", bgcolor: "background.default" }}>
        <Box component="header" sx={{ height: 72, px: { xs: 2, md: 4 }, bgcolor: "white", borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><IconButton size="small"><SearchRoundedIcon /></IconButton><Typography variant="body2" color="text.secondary">프로젝트 검색</Typography></Stack>
          <Stack direction="row" spacing={1}><Button variant="outlined" color="inherit" onClick={authenticated ? logout : () => setLoginOpen(true)}>{authenticated ? "로그아웃" : "관리자 로그인"}</Button><Tooltip title="필수 QA와 실제 약품 사진 승인 후 사용할 수 있습니다"><span><Button variant="contained" startIcon={<DownloadRoundedIcon />} disabled>PNG 생성 승인</Button></span></Tooltip><Tooltip title="더보기"><IconButton><MoreVertRoundedIcon /></IconButton></Tooltip></Stack>
        </Box>

        <Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}>
            <Box><Typography variant="body2" color="text.secondary" mb={.5}>카드 프로젝트  /  {activeProject?.country || "일본"}</Typography><Typography variant="h4">{activeProject?.city || "오사카"} 위급정보 카드</Typography>{backendNotice && <Typography variant="caption" color="warning.main">{backendNotice}</Typography>}</Box>
            <Stack direction="row" spacing={1}><Chip icon={<ScheduleRoundedIcon />} label={activeProject?.run_date ? new Date(activeProject.run_date).toLocaleString("ko-KR") : "자동 생성 대기"} variant="outlined" />{projectDetail?.version && <Chip label={`version ${projectDetail.version.version}`} variant="outlined" />}<Chip label={activeProject ? (statusLabel[activeProject.status] || activeProject.status) : "디자인 샘플"} color="warning" variant="outlined" /></Stack>
          </Stack>

          <Card sx={{ mt: 3 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2 }}><Tab label="카드 미리보기" /><Tab label="자동화 프롬프트" /><Tab label="출처·이미지" /><Tab label="QA 검수" /></Tabs>
          </Card>

          {tab === 0 && <Box sx={{ mt: 3, display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(560px,1fr) 360px" }, gap: 3 }}>
            <Card><CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}><Box><Typography variant="overline" color="primary.main" fontWeight={850}>CARD {cards[selected][0]} / 07</Typography><Typography variant="h5">{cards[selected][1]}</Typography></Box><Chip label="승인 디자인 레퍼런스" color="success" variant="outlined" size="small" /></Stack>
              <Box sx={{ position: "relative", display: "grid", placeItems: "center", py: 3, minHeight: 560 }}>
                <IconButton aria-label="이전 카드" disabled={selected === 0} onClick={() => setSelected(v => v - 1)} sx={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", zIndex: 2, width: 48, height: 48, bgcolor: "white", border: "1px solid", borderColor: "divider", boxShadow: "0 8px 24px rgba(16,24,40,.14)", "&:hover": { bgcolor: "primary.main", color: "white" }, "&.Mui-disabled": { bgcolor: "#f2f4f7", opacity: .5 } }}><ArrowBackRoundedIcon /></IconButton>
                <Box component="figure" sx={{ m: 0, textAlign: "center" }}><Box component="button" type="button" aria-label={`${cards[selected][1]} 카드 크게 보기`} onClick={() => setImageOpen(true)} sx={{ display: "block", width: "min(300px, calc(100vw - 150px))", aspectRatio: "941 / 1672", p: 0, border: 0, bgcolor: "transparent", cursor: "zoom-in", borderRadius: 0, transition: "transform .2s ease", "&:hover": { transform: "translateY(-3px)" }, "&:focus-visible": { outline: "3px solid", outlineColor: "primary.main", outlineOffset: 4 } }}><Box component="img" src={cards[selected][2]} alt={`승인된 오사카 ${cards[selected][1]} 카드`} sx={{ display: "block", width: "100%", height: "100%", objectFit: "cover", border: "7px solid #07111f", boxSizing: "border-box", boxShadow: "0 22px 55px rgba(16,24,40,.18)" }} /></Box><Typography component="figcaption" variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>이미지를 클릭하면 크게 볼 수 있습니다</Typography></Box>
                <IconButton aria-label="다음 카드" disabled={selected === cards.length - 1} onClick={() => setSelected(v => v + 1)} sx={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", zIndex: 2, width: 48, height: 48, bgcolor: "white", border: "1px solid", borderColor: "divider", boxShadow: "0 8px 24px rgba(16,24,40,.14)", "&:hover": { bgcolor: "primary.main", color: "white" }, "&.Mui-disabled": { bgcolor: "#f2f4f7", opacity: .5 } }}><ArrowForwardRoundedIcon /></IconButton>
              </Box>
              <Stack direction="row" spacing={.8} sx={{ justifyContent: "center" }}>{cards.map((_, i) => <Box component="button" aria-label={`${i + 1}번 카드`} key={i} onClick={() => setSelected(i)} sx={{ width: i === selected ? 20 : 8, height: 8, borderRadius: 4, border: 0, p: 0, cursor: "pointer", bgcolor: i === selected ? "primary.main" : "#d0d5dd", transition: ".2s" }} />)}</Stack>
            </CardContent></Card>

            <Stack spacing={3}>
              <Card><CardContent><Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}><Typography variant="h6">검수 메모</Typography><Chip label={`${liveQa?.blockers?.length || 0}개 확인 필요`} size="small" color="warning" /></Stack><Divider sx={{ my: 2 }} /><FormControl fullWidth size="small"><InputLabel>대상 카드</InputLabel><Select label="대상 카드" value={selected + 1} onChange={(event) => setSelected(Number(event.target.value) - 1)}>{cards.map((card, index) => <MenuItem key={card[0]} value={index + 1}>{index + 1}. {card[1]}</MenuItem>)}</Select></FormControl><TextField multiline minRows={4} fullWidth label="프롬프트로 수정 요청" value={reviewPrompt} onChange={(event) => setReviewPrompt(event.target.value)} sx={{ mt: 2 }} />{reviewMessage && <Typography variant="body2" color={reviewMessage.includes("생성") ? "success.main" : "error.main"} mt={1}>{reviewMessage}</Typography>}<Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={submitRevision} disabled={reviewSaving || !reviewPrompt.trim()}>{reviewSaving ? "새 버전 생성 중…" : authenticated ? "수정 요청하고 새 버전 생성" : "로그인 후 수정 요청"}</Button></CardContent></Card>
              <Card><CardContent><Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography variant="h6">진행률</Typography><Typography color="primary.main" fontWeight={850}>{passed} / {checks.length}</Typography></Stack><LinearProgress variant="determinate" value={(passed / checks.length) * 100} sx={{ my: 2, height: 7, borderRadius: 4 }} /><Stack spacing={1.2}>{checks.slice(0, 4).map(([label, ok]) => <Stack direction="row" spacing={1} key={label} sx={{ alignItems: "center" }}>{ok ? <CheckCircleRoundedIcon color="success" fontSize="small" /> : <ErrorRoundedIcon color="warning" fontSize="small" />}<Typography variant="body2">{label}</Typography></Stack>)}</Stack></CardContent></Card>
            </Stack>
          </Box>}

          {tab === 1 && <Card sx={{ mt: 3 }}><CardContent sx={{ p: 3 }}><Stack direction={{ xs: "column", sm: "row" }} gap={2} sx={{ justifyContent: "space-between" }}><Box><Typography variant="overline" color="primary.main" fontWeight={850}>AUTOMATION PROMPT</Typography><Typography variant="h5">매일 아침 제작 지시문</Typography><Typography variant="body2" color="text.secondary" mt={1}>현재 브라우저에 임시 저장되며 Supabase 연결 후 팀 공용 버전으로 전환됩니다.</Typography></Box><Button variant="contained" onClick={savePrompt}>{saved ? "저장됨" : "프롬프트 저장"}</Button></Stack><TextField value={prompt} onChange={e => setPrompt(e.target.value)} multiline minRows={15} fullWidth sx={{ mt: 3, "& textarea": { fontFamily: "ui-monospace, monospace", lineHeight: 1.7 } }} /><Stack direction="row" mt={1} sx={{ justifyContent: "space-between" }}><Typography variant="caption" color="text.secondary">매일 오전 6시 실행 · 오전 7시 검수 준비</Typography><Typography variant="caption" color="text.secondary">{prompt.length}자</Typography></Stack></CardContent></Card>}

          {tab === 2 && <Card sx={{ mt: 3 }}><CardContent sx={{ p: 3 }}>
            <Stack direction="row" sx={{ justifyContent: "space-between" }}><Box><Typography variant="overline" color="primary.main" fontWeight={850}>SOURCE REGISTRY</Typography><Typography variant="h5">정보·이미지 출처</Typography></Box><Chip label={`${liveSources.length}개 정보 출처`} variant="outlined" /></Stack>
            <Box sx={{ mt: 3, overflowX: "auto" }}>{liveSources.length ? liveSources.map((source, i) => <Stack key={`${source.url}-${i}`} direction={{ xs: "column", sm: "row" }} gap={1} sx={{ py: 2, borderBottom: "1px solid", borderColor: "divider", alignItems: { sm: "center" } }}><Box sx={{ flex: 1 }}><Typography variant="body2" fontWeight={750}>{source.title || "제목 미확인"}</Typography><Typography variant="caption" color="text.secondary">{source.publisher || "발행기관 미확인"}</Typography></Box><Button component="a" href={source.url || undefined} target="_blank" rel="noreferrer" disabled={!source.url} size="small" startIcon={<LinkRoundedIcon />}>원문 확인</Button><Chip label={source.supports ? "근거 연결" : "근거 확인 필요"} size="small" color={source.supports ? "success" : "warning"} variant="outlined" /></Stack>) : <Typography color="text.secondary">저장된 출처 후보가 없습니다.</Typography>}</Box>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6">약품 실제 이미지 후보</Typography>
            {projectDetail?.assets?.length ? <Box>{projectDetail.assets.map((asset) => <Stack key={asset.id} direction={{ xs: "column", sm: "row" }} gap={1} sx={{ py: 1.5, borderBottom: "1px solid", borderColor: "divider", alignItems: { sm: "center" } }}><Box sx={{ flex: 1 }}><Typography fontWeight={750}>{asset.category} · {asset.local_product_name}</Typography><Button component="a" href={asset.source_url} target="_blank" rel="noreferrer" size="small" sx={{ px: 0 }}>제조사 제품 페이지 확인</Button></Box><Chip label={asset.approval_status === "downloaded" ? "승인·저장됨" : "승인 대기"} size="small" color={asset.approval_status === "downloaded" ? "success" : "warning"} variant="outlined" />{asset.approval_status === "downloaded" ? <Button component="a" href={`/api/assets/${asset.id}/file`} target="_blank" size="small">저장 이미지 보기</Button> : <Button variant="outlined" size="small" onClick={() => setApproveAssetId(asset.id)}>확인 후 승인</Button>}</Stack>)}</Box> : <Paper variant="outlined" sx={{ mt: 2, p: 2, bgcolor: "#fffbeb" }}><Typography fontWeight={800}>승인 가능한 실제 약품 사진 후보 없음</Typography><Typography variant="body2" color="text.secondary">아래에서 제조사 제품 페이지와 실제 패키지 이미지 URL을 함께 등록하세요.</Typography></Paper>}
            <Box sx={{ mt: 3, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
              <TextField label="분류 (예: 열·두통)" value={assetForm.category} onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })} />
              <TextField label="현지 제품명" value={assetForm.localProductName} onChange={(e) => setAssetForm({ ...assetForm, localProductName: e.target.value })} />
              <TextField label="한국어 제품명" value={assetForm.koreanProductName} onChange={(e) => setAssetForm({ ...assetForm, koreanProductName: e.target.value })} />
              <TextField label="사용 조건 메모" value={assetForm.usageNote} onChange={(e) => setAssetForm({ ...assetForm, usageNote: e.target.value })} />
              <TextField label="제조사 공식 제품 페이지 URL" value={assetForm.productPageUrl} onChange={(e) => setAssetForm({ ...assetForm, productPageUrl: e.target.value })} sx={{ gridColumn: { md: "1 / -1" } }} />
              <TextField label="실제 패키지 이미지 직접 URL" value={assetForm.imageUrl} onChange={(e) => setAssetForm({ ...assetForm, imageUrl: e.target.value })} sx={{ gridColumn: { md: "1 / -1" } }} />
            </Box>
            {assetMessage && <Typography variant="body2" color={assetMessage.includes("실패") || assetMessage.includes("필요") ? "error.main" : "success.main"} mt={1.5}>{assetMessage}</Typography>}
            <Button variant="contained" sx={{ mt: 2 }} onClick={addAssetCandidate} disabled={assetSaving}>약품 이미지 후보 등록</Button>
          </CardContent></Card>}

          {tab === 3 && <Card sx={{ mt: 3 }}><CardContent sx={{ p: 3 }}><Stack direction="row" sx={{ justifyContent: "space-between" }}><Box><Typography variant="overline" color="primary.main" fontWeight={850}>QUALITY GATE</Typography><Typography variant="h5">발행 전 검수</Typography></Box><Chip label={`${liveQa?.passed?.length || 0}개 통과`} color="primary" /></Stack><Stack mt={3}>{(liveQa?.blockers || ["실제 조사 데이터 생성 대기"]).map((label) => <Stack key={label} direction="row" spacing={1.5} sx={{ py: 1.7, borderBottom: "1px solid", borderColor: "divider", alignItems: "center" }}><ErrorRoundedIcon color="warning" /><Typography variant="body2" fontWeight={750} sx={{ flex: 1 }}>{label}</Typography><Chip label="해결 필요" size="small" color="warning" variant="outlined" /></Stack>)}{(liveQa?.passed || []).map((label) => <Stack key={label} direction="row" spacing={1.5} sx={{ py: 1.7, borderBottom: "1px solid", borderColor: "divider", alignItems: "center" }}><CheckCircleRoundedIcon color="success" /><Typography variant="body2" fontWeight={750} sx={{ flex: 1 }}>{label}</Typography><Chip label="통과" size="small" color="success" variant="outlined" /></Stack>)}</Stack><Paper variant="outlined" sx={{ mt: 3, p: 2, borderColor: "warning.main", bgcolor: "#fffbeb" }}><Typography fontWeight={800}>모든 필수 QA 통과 후 승인할 수 있습니다</Typography><Typography variant="body2" color="text.secondary" mt={.5}>현재 version은 검수 초안입니다. PNG 생성과 다운로드는 아직 차단되어 있습니다.</Typography></Paper></CardContent></Card>}
        </Box>
      </Box>

      <Dialog open={loginOpen} onClose={() => setLoginOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>관리자 로그인</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>Vercel에 등록한 관리자 비밀번호를 입력하세요. 비밀번호는 서버에서만 확인됩니다.</Typography>
          <TextField autoFocus fullWidth type="password" label="관리자 비밀번호" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void login(); }} error={Boolean(loginError)} helperText={loginError} />
          <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={login} disabled={!adminPassword}>로그인</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(approveAssetId)} onClose={() => setApproveAssetId(null)} maxWidth="sm" fullWidth>
        <DialogTitle>실제 약품 이미지 승인</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>제조사 제품 페이지와 이미지 속 현지 제품명이 같은지 확인하세요. 승인하면 서버가 이미지를 내려받아 비공개 Supabase Storage에 저장합니다.</Typography>
          <FormControlLabel control={<Checkbox checked={confirmProductMatch} onChange={(e) => setConfirmProductMatch(e.target.checked)} />} label="이미지 속 제품명과 등록한 현지 제품명이 일치합니다." />
          <FormControlLabel control={<Checkbox checked={confirmUsageRights} onChange={(e) => setConfirmUsageRights(e.target.checked)} />} label="이미지 사용 조건과 출처 표기 방법을 확인했습니다." />
          <Button fullWidth variant="contained" sx={{ mt: 2 }} color="warning" disabled={!confirmProductMatch || !confirmUsageRights || assetSaving} onClick={approveAndDownloadAsset}>{assetSaving ? "확인·저장 중…" : "승인하고 이미지 저장"}</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={imageOpen} onClose={() => setImageOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { bgcolor: "#0b1220", color: "white", maxHeight: "94vh" } }} slotProps={{ backdrop: { sx: { bgcolor: "rgba(3,7,18,.88)", backdropFilter: "blur(4px)" } } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1.5 }}>
          <Box><Typography variant="overline" sx={{ color: "#a5b4fc", fontWeight: 850 }}>CARD {cards[selected][0]} / 07</Typography><Typography variant="h6" color="white">오사카 · {cards[selected][1]}</Typography></Box>
          <IconButton aria-label="닫기" onClick={() => setImageOpen(false)} sx={{ color: "white" }}><CloseRoundedIcon /></IconButton>
        </DialogTitle>
        <Divider sx={{ borderColor: "#ffffff18" }} />
        <DialogContent sx={{ position: "relative", p: { xs: 2, md: 3 }, display: "grid", placeItems: "center" }}>
          <IconButton aria-label="이전 카드" disabled={selected === 0} onClick={() => setSelected(v => v - 1)} sx={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", zIndex: 3, bgcolor: "rgba(255,255,255,.94)", color: "#111827", boxShadow: "0 8px 28px rgba(0,0,0,.3)", "&:hover": { bgcolor: "primary.main", color: "white" }, "&.Mui-disabled": { bgcolor: "rgba(255,255,255,.35)", color: "rgba(17,24,39,.4)" } }}><ArrowBackRoundedIcon /></IconButton>
          <Box component="img" src={cards[selected][2]} alt={`확대된 오사카 ${cards[selected][1]} 카드`} sx={{ display: "block", width: "min(420px, calc(100vw - 96px))", aspectRatio: "941 / 1672", maxHeight: "72vh", objectFit: "contain", bgcolor: "#07111f", boxShadow: "0 24px 70px rgba(0,0,0,.38)" }} />
          <IconButton aria-label="다음 카드" disabled={selected === cards.length - 1} onClick={() => setSelected(v => v + 1)} sx={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", zIndex: 3, bgcolor: "rgba(255,255,255,.94)", color: "#111827", boxShadow: "0 8px 28px rgba(0,0,0,.3)", "&:hover": { bgcolor: "primary.main", color: "white" }, "&.Mui-disabled": { bgcolor: "rgba(255,255,255,.35)", color: "rgba(17,24,39,.4)" } }}><ArrowForwardRoundedIcon /></IconButton>
          <Typography variant="caption" sx={{ color: "#9ca3af", mt: 2 }}>{selected + 1} / {cards.length}</Typography>
        </DialogContent>
      </Dialog>
    </ThemeProvider>
  );
}
