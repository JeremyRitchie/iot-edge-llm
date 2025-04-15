import { useLocation } from "react-router-dom"
import { AppRoutes } from "./PageNavigation"
import { Box, SpaceBetween, SplitPanel } from "@cloudscape-design/components"
import { useAtom } from "jotai"


export const SplitPanelPage = () => {
    const { pathname } = useLocation();

    return (
        <>
            Split panel pages here based on routes
        </>
    )
}