glb handler
<!-- TOP NAV BACK BUTTON -->
<a href="../" class="nav-back-btn glass-panel" title="Back to Hair Physics Demo">
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
  <span>Hair Physics</span>
</a>

css
/* TOP NAV BACK BUTTON */
.nav-back-btn {
  position: fixed;
  top: 16px;
  left: 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 500;
  text-decoration: none;
  z-index: 25;
  transition: all 0.15s ease;
  border-radius: 10px;
  cursor: pointer;
}
.nav-back-btn:hover {
  color: var(--text);
  border-color: var(--accent);
  background: rgba(110, 142, 251, 0.14);
  transform: translateY(-1px);
  box-shadow: 0 0 16px var(--accent-glow);
}
.nav-back-btn svg {
  transition: transform 0.15s ease;
}
.nav-back-btn:hover svg {
  transform: translateX(-2px);
}



index root
    <!-- Top Right Actions -->
    <div class="top-right-bar">
        <a href="glb-handler/" class="btn" title="Open GLB & Collider Authoring Tool">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Collider Editor
        </a>