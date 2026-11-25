export default defineBackground(() => {
  void browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});
