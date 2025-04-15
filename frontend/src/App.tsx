import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { applyMode } from "@cloudscape-design/global-styles";
import { ToastContainer, Slide } from "react-toastify";
import { AppLayout } from "@cloudscape-design/components";
import { BrowserRouter } from "react-router-dom";

// components 
import TopBar from "./components/TopBar";

import { PageContent, AppSideNavigation, InfoContent } from "./pages/PageNavigation";
import { SplitPanelPage } from "./pages/SplitPanelPage";
import { infoDrawerAtom, navDrawerAtom, themeAtom } from "./atoms/AppAtoms";


const appLayoutLabels = {
  navigation: 'Side navigation',
  navigationToggle: 'Open side navigation',
  navigationClose: 'Close side navigation',
  notifications: 'Notifications',
  tools: 'Help panel',
  toolsToggle: 'Open help panel',
  toolsClose: 'Close help panel',
};

function App() {
  // Create a client
  const queryClient = new QueryClient()
  // atoms
  const [theme] = useAtom(themeAtom);
  const [navDrawer, setNavDrawer] = useAtom(navDrawerAtom);
  const [infoDrawer, setInfoDrawer] = useAtom(infoDrawerAtom);

  const [showSplitPanel, setShowSplitPanel] = useState(false)

  // theme control
  applyMode(theme);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastContainer position="bottom-left"
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme={theme}
        transition={Slide}
      />
      <TopBar />
      <BrowserRouter>
        <AppLayout
          content={<PageContent />}
          // breadcrumbs={<> Page Crumbs </>}
          splitPanelOpen={showSplitPanel}
          splitPanel={showSplitPanel && <SplitPanelPage />}
          onSplitPanelToggle={() => setShowSplitPanel(!showSplitPanel)}
          navigationOpen={navDrawer}
          navigation={<AppSideNavigation />}
          onNavigationChange={({ detail }) => setNavDrawer(detail.open)}
          tools={<InfoContent />}
          toolsOpen={infoDrawer}
          onToolsChange={({ detail }) => setInfoDrawer(detail.open)}
          contentType="default"
          ariaLabels={appLayoutLabels}
          notifications={[]} // stack page level notifications here
        />

      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
