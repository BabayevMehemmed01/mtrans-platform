# PROGRESS.md — Layihə Vəziyyəti

> Bu fayl 2026-08-14 tarixli sessiyada tam yenidən yazıldı, çünki əvvəlki versiya bir neçə tapşırığı **səhv olaraq "tamamlandı"** kimi qeyd etmişdi (agentlər kompüter söndürülərkən yarımçıq kəsilmişdi, amma status "bitdi" yazılmışdı). Bu dəfə hər bənd diskdəki faktiki koda qarşı yoxlanıb.

## ✅ TAMAMLANMIŞ VƏ TSC/BUILD İLƏ TƏSDİQLƏNMİŞ

Bunların hamısı bu sessiyada `npx tsc --noEmit` (təmiz) və tam `npm run build` (uğurlu, bütün route-lar compile olundu) ilə yoxlanılıb:

1. **Bug fix-lər**: `updateLabelSchema` export-u əlavə edildi (`src/lib/validations/index.ts`), `DialogContent`-ə `showCloseButton` prop dəstəyi əlavə edildi (`src/components/ui/dialog.tsx`).
2. **Notifications sistemi** — `api/notifications/route.ts` (GET/PATCH), `api/notifications/[id]/route.ts`, Header.tsx-də real bell dropdown (SWR polling, unread badge, mark-as-read).
3. **Command Palette (⌘K)** — `src/components/layout/CommandPalette.tsx`, `src/store/useCommandPaletteStore.ts`, Header-in axtarış düyməsinə bağlandı, `dashboard/layout.tsx`-a mount edildi.
4. **Chat zəng infrastrukturu (WebRTC, polling-based signaling)** — `api/calls/*` (route, incoming, [id], [id]/signals), `src/hooks/useWebRTC.ts`, `src/store/useCallStore.ts`, `src/components/chat/CallOverlay.tsx`, ChatClient.tsx-də zəng düymələri (yalnız 2-üzvlü kanallarda). STUN-only, TURN server yoxdur (restriktiv NAT arxasında uğursuz ola bilər — production qeydi).
5. **Dəvət sistemi (Member/Guest)** — `src/lib/resend.ts`, `src/lib/invites.ts`, `api/invites/*`, `(auth)/invite/[token]/*`. Köhnə "Member@1234" hardcoded şifrə yolu tamamilə silindi. `src/proxy.ts`-ə `/invite` və `/api/invites/accept` public route-ları əlavə edildi. `CAN_INVITE_USER` icazəsi istifadə olunur. MembersClient.tsx-də Aktiv/Dəvətlər tabları, Member/Guest toggle + layihə seçimi (guest üçün ProjectMember VIEWER).
6. **Şöbə rəhbəri (headUserId)** — DepartmentsClient.tsx-də seçim UI-si, API-lər `headUserId`/`head` qaytarır.
7. **AuditLog** — `src/lib/audit.ts` helper, 15 mutasiya edən route-a (`projects`, `tasks`, `departments`, `roles`, `labels`, `settings/company`, `members/[id]`, `invites`, `invites/accept`, `attachments`, `comments`) `logAudit()` çağırışları əlavə edildi.
8. **Dashboard + My Work premium qrafiklər** — `recharts` quraşdırıldı. Dashboard-a 14-günlük tapşırıq trendi (area chart), statusa görə bar chart, "Son Fəaliyyət" feed-i (AuditLog-dan) əlavə edildi; saxta "+2 bu ay" mətni real say ilə əvəz olundu. My Work-ə şəxsi 7-günlük tamamlanma bar chart-ı əlavə edildi (`api/my-work` `weeklyCompleted` sahəsi ilə).

Əvvəlki sessiyadan həqiqətən tamamlanmış (bu sessiyada da diskdən təsdiqləndi, YALNIZ RBAC/CRM/task-collaboration/dependency-cleanup): TaskStatus enum düzəlişləri, zod validasiya düzəlişləri, CRM auth/tenant izolasiyası, Labels modulu, ölü kod təmizliyi, per-project RBAC (`requireProjectAccess`/`canViewProject`), tapşırıq subtask/comment/attachment sistemi, CRM Kanban/List + `@dnd-kit`, `@tanstack/react-query` təmizliyi, auth.ts-dəki debug log-ların silinməsi.

## 🧹 Təmizlik

`.claude/worktrees/agent-*` qovluqları (6 ədəd, hamısı boş/köhnə idi) silindi, `git worktree prune` işə salındı.

## ⚠️ Bilinən məhdudiyyətlər (qəsdli, blocker deyil)

- WebRTC zənglər üçün TURN server yoxdur — yalnız STUN. Restriktiv NAT arxasında zəng uğursuz ola bilər.
- Resend email API key .env-də boşdursa, dəvət linki console-a log olunur (email göndərilmir) — dev üçün gözlənilən davranış.
- AuditLog cədvəli bu sessiyaya qədər boş idi, indi yeni mutasiyalarla dolmağa başlayacaq — "Son Fəaliyyət" feed-i əvvəlcə boş görünəcək, bu normaldır.

## 🚀 Növbəti sessiyada mümkün istiqamətlər

- Real istifadədə (brauzerdə) hər üç yeni böyük modulun (Dəvət qəbulu, zəng, notification) manual test edilməsi — bu sessiyada yalnız `tsc`/`build` yoxlanıldı, UI davranışı brauzerdə yoxlanılmayıb.
- TURN server inteqrasiyası (production zəng etibarlılığı üçün).
- Resend API key-in real təyin edilməsi (production email göndərmə üçün).
