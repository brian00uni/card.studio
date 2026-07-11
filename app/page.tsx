"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Avatar, Box, Button, Card, CardContent, Chip, CssBaseline, Divider, Drawer,
  FormControl, IconButton, InputLabel, LinearProgress, List, ListItemButton,
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
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

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

const queue = [
  ["오사카", "일본", "검수 준비", "오늘 06:42"],
  ["다낭", "베트남", "대기", "내일 06:00"],
  ["나트랑", "베트남", "대기", "순서 3"],
] as const;

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
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("card-studio-prompt");
    if (stored) queueMicrotask(() => setPrompt(stored));
  }, []);

  const passed = useMemo(() => checks.filter(([, ok]) => ok).length, []);
  const savePrompt = () => {
    window.localStorage.setItem("card-studio-prompt", prompt);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
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
            <Stack spacing={1} mt={1.5}>{queue.map(([city, country, status], i) => <Paper key={city} elevation={0} sx={{ p: 1.5, bgcolor: i === 0 ? "#ffffff0d" : "transparent", border: "1px solid", borderColor: i === 0 ? "#ffffff18" : "transparent", color: "white" }}><Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}><Box><Typography variant="body2" fontWeight={800}>{city}</Typography><Typography variant="caption" color="#7f8a9d">{country}</Typography></Box><Chip label={status} size="small" sx={{ height: 22, bgcolor: i === 0 ? "#4f46e533" : "#ffffff0a", color: i === 0 ? "#a5b4fc" : "#7f8a9d", fontSize: 10 }} /></Stack></Paper>)}</Stack>
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
          <Stack direction="row" spacing={1}><Button variant="outlined" color="inherit" startIcon={<ShareRoundedIcon />}>공유 링크</Button><Button variant="contained" startIcon={<DownloadRoundedIcon />} onClick={() => setApproved(true)}>PNG 생성 승인</Button><Tooltip title="더보기"><IconButton><MoreVertRoundedIcon /></IconButton></Tooltip></Stack>
        </Box>

        <Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}>
            <Box><Typography variant="body2" color="text.secondary" mb={.5}>카드 프로젝트  /  일본</Typography><Typography variant="h4">오사카 위급정보 카드</Typography></Box>
            <Stack direction="row" spacing={1}><Chip icon={<ScheduleRoundedIcon />} label="오늘 06:42 생성" variant="outlined" /><Chip label="검수 준비 전" color="warning" variant="outlined" /></Stack>
          </Stack>

          <Card sx={{ mt: 3 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2 }}><Tab label="카드 미리보기" /><Tab label="자동화 프롬프트" /><Tab label="출처·이미지" /><Tab label="QA 검수" /></Tabs>
          </Card>

          {tab === 0 && <Box sx={{ mt: 3, display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(560px,1fr) 360px" }, gap: 3 }}>
            <Card><CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}><Box><Typography variant="overline" color="primary.main" fontWeight={850}>CARD {cards[selected][0]} / 07</Typography><Typography variant="h5">{cards[selected][1]}</Typography></Box><Chip label="승인 디자인 레퍼런스" color="success" variant="outlined" size="small" /></Stack>
              <Box sx={{ display: "grid", placeItems: "center", py: 3 }}><Box component="figure" sx={{ m: 0, textAlign: "center" }}><Box component="img" src={cards[selected][2]} alt={`승인된 오사카 ${cards[selected][1]} 카드`} sx={{ display: "block", width: 300, maxWidth: "100%", aspectRatio: "941 / 1672", objectFit: "cover", border: "7px solid #07111f", boxShadow: "0 22px 55px rgba(16,24,40,.18)" }} /><Typography component="figcaption" variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>공유 채팅에서 확정한 카드 포맷</Typography></Box></Box>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 2, maxWidth: 620, mx: "auto" }}>
                <Button variant="outlined" startIcon={<ArrowBackRoundedIcon />} disabled={selected === 0} onClick={() => setSelected(v => v - 1)} sx={{ justifySelf: "start" }}>이전 카드</Button>
                <Stack direction="row" spacing={.8}>{cards.map((_, i) => <Box component="button" aria-label={`${i + 1}번 카드`} key={i} onClick={() => setSelected(i)} sx={{ width: i === selected ? 20 : 8, height: 8, borderRadius: 4, border: 0, p: 0, cursor: "pointer", bgcolor: i === selected ? "primary.main" : "#d0d5dd", transition: ".2s" }} />)}</Stack>
                <Button variant="outlined" endIcon={<ArrowForwardRoundedIcon />} disabled={selected === 6} onClick={() => setSelected(v => v + 1)} sx={{ justifySelf: "end" }}>다음 카드</Button>
              </Box>
            </CardContent></Card>

            <Stack spacing={3}>
              <Card><CardContent><Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}><Typography variant="h6">검수 메모</Typography><Chip label="3개 확인 필요" size="small" color="warning" /></Stack><Divider sx={{ my: 2 }} /><FormControl fullWidth size="small"><InputLabel>카드 상태</InputLabel><Select label="카드 상태" defaultValue="edit"><MenuItem value="edit">수정 필요</MenuItem><MenuItem value="approved">승인</MenuItem></Select></FormControl><TextField multiline minRows={4} fullWidth label="수정 요청" defaultValue="실제 조사 데이터로 교체한 뒤 전화번호와 이미지 출처를 다시 확인해주세요." sx={{ mt: 2 }} /><Button fullWidth variant="contained" sx={{ mt: 2 }}>수정 요청 저장</Button></CardContent></Card>
              <Card><CardContent><Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography variant="h6">진행률</Typography><Typography color="primary.main" fontWeight={850}>{passed} / {checks.length}</Typography></Stack><LinearProgress variant="determinate" value={(passed / checks.length) * 100} sx={{ my: 2, height: 7, borderRadius: 4 }} /><Stack spacing={1.2}>{checks.slice(0, 4).map(([label, ok]) => <Stack direction="row" spacing={1} key={label} sx={{ alignItems: "center" }}>{ok ? <CheckCircleRoundedIcon color="success" fontSize="small" /> : <ErrorRoundedIcon color="warning" fontSize="small" />}<Typography variant="body2">{label}</Typography></Stack>)}</Stack></CardContent></Card>
            </Stack>
          </Box>}

          {tab === 1 && <Card sx={{ mt: 3 }}><CardContent sx={{ p: 3 }}><Stack direction={{ xs: "column", sm: "row" }} gap={2} sx={{ justifyContent: "space-between" }}><Box><Typography variant="overline" color="primary.main" fontWeight={850}>AUTOMATION PROMPT</Typography><Typography variant="h5">매일 아침 제작 지시문</Typography><Typography variant="body2" color="text.secondary" mt={1}>현재 브라우저에 임시 저장되며 Supabase 연결 후 팀 공용 버전으로 전환됩니다.</Typography></Box><Button variant="contained" onClick={savePrompt}>{saved ? "저장됨" : "프롬프트 저장"}</Button></Stack><TextField value={prompt} onChange={e => setPrompt(e.target.value)} multiline minRows={15} fullWidth sx={{ mt: 3, "& textarea": { fontFamily: "ui-monospace, monospace", lineHeight: 1.7 } }} /><Stack direction="row" mt={1} sx={{ justifyContent: "space-between" }}><Typography variant="caption" color="text.secondary">매일 오전 6시 실행 · 오전 7시 검수 준비</Typography><Typography variant="caption" color="text.secondary">{prompt.length}자</Typography></Stack></CardContent></Card>}

          {tab === 2 && <Card sx={{ mt: 3 }}><CardContent sx={{ p: 3 }}><Stack direction="row" sx={{ justifyContent: "space-between" }}><Box><Typography variant="overline" color="primary.main" fontWeight={850}>SOURCE REGISTRY</Typography><Typography variant="h5">정보·이미지 출처</Typography></Box><Button variant="outlined">출처 추가</Button></Stack><Box sx={{ mt: 3, overflowX: "auto" }}>{[["한국어 긴급전화", "공식 공관 · A", "확인 필요"], ["병원 운영정보", "병원 공식 · A", "확인 필요"], ["약품 패키지", "제조사 공식 · A", "자산 필요"], ["현지어 문장", "사람 검수", "감수 필요"]].map((r, i) => <Stack key={r[0]} direction="row" sx={{ py: 2, borderBottom: "1px solid", borderColor: "divider", alignItems: "center" }}><Typography variant="body2" fontWeight={750} sx={{ flex: 1 }}>{r[0]}</Typography><Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>{r[1]}</Typography><Chip label={r[2]} size="small" color={i < 2 ? "warning" : "default"} variant="outlined" /></Stack>)}</Box></CardContent></Card>}

          {tab === 3 && <Card sx={{ mt: 3 }}><CardContent sx={{ p: 3 }}><Stack direction="row" sx={{ justifyContent: "space-between" }}><Box><Typography variant="overline" color="primary.main" fontWeight={850}>QUALITY GATE</Typography><Typography variant="h5">발행 전 검수</Typography></Box><Chip label={`${passed} / ${checks.length} 통과`} color="primary" /></Stack><Stack mt={3}>{checks.map(([label, ok]) => <Stack key={label} direction="row" spacing={1.5} sx={{ py: 1.7, borderBottom: "1px solid", borderColor: "divider", alignItems: "center" }}>{ok ? <CheckCircleRoundedIcon color="success" /> : <ErrorRoundedIcon color="warning" />}<Typography variant="body2" fontWeight={750} sx={{ flex: 1 }}>{label}</Typography><Chip label={ok ? "통과" : "확인 필요"} size="small" color={ok ? "success" : "warning"} variant="outlined" /></Stack>)}</Stack><Paper variant="outlined" sx={{ mt: 3, p: 2, borderColor: approved ? "success.main" : "warning.main", bgcolor: approved ? "#ecfdf5" : "#fffbeb" }}><Typography fontWeight={800}>{approved ? "PNG 생성이 승인되었습니다" : "모든 필수 QA 통과 후 승인하세요"}</Typography><Typography variant="body2" color="text.secondary" mt={.5}>{approved ? "실제 렌더러 연결 후 1080×1920 PNG 7장이 생성됩니다." : "현재 샘플 데이터이므로 실제 발행 파일은 생성하지 않습니다."}</Typography></Paper></CardContent></Card>}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
