import { SideNavigation } from "@cloudscape-design/components";
// router
import { useLocation, useNavigate, Routes, Route, } from "react-router-dom";
import { AppName } from "../atoms/AppAtoms";
import { TextGeneration } from "./TextGeneration";
import { TextGenerationInfo } from "./info/TextGenerationInfo"
import { ChatBot } from "./Chatbot";
import { ChatbotInfo } from "./info/ChatbotInfo";
import { EngineVibration } from "./EngineVibration";
import { EngineVibrationInfo } from "./info/EngineVibrationInfo" ;

export const AppRoutes = {
    textGeneration: {
        text: "Text Generation",
        href: "/",
    },
    chatbot: {
        text: "Chatbot",
        href: "/chatbot",
    },
    engineVibration: {
        text: "Engine Vibration",
        href: "/engine-vibration",
    }
}

export const AppSideNavigation = () => {
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <SideNavigation
            activeHref={location.pathname}
            header={{ href: AppRoutes.textGeneration.href, text: AppName }}
            onFollow={(event) => {
                if (!event.detail.external) {
                    event.preventDefault();
                    navigate(event.detail.href);
                }
            }}
            items={[
                {
                    type: "section-group",
                    title: "",
                    items: [
                        {
                            type: "link",
                            text: AppRoutes.textGeneration.text,
                            href: AppRoutes.textGeneration.href
                        },
                        {
                            type: "link",
                            text: AppRoutes.chatbot.text,
                            href: AppRoutes.chatbot.href
                        },
                        {
                            type: "link",
                            text: AppRoutes.engineVibration.text,
                            href: AppRoutes.engineVibration.href
                        },
                    ]
                },
                {
                    type: 'divider'
                },
                {
                    type: "link",
                    text: "Version 1.1",
                    href: "#"
                }
            ]}
        />
    );
};

export const PageContent = () => {
    return (
        <Routes>
            <Route path={AppRoutes.textGeneration.href} element={<TextGeneration />} />
            <Route path={AppRoutes.chatbot.href} element={<ChatBot />} />
            <Route path={AppRoutes.engineVibration.href} element={<EngineVibration />} />
            <Route path="*" element={<>Page not found </>} />
        </Routes>
    )
}

export const InfoContent = () => {
    return (
        <Routes>
            <Route path={AppRoutes.textGeneration.href} element={<TextGenerationInfo />} />
            <Route path={AppRoutes.chatbot.href} element={<ChatbotInfo />} />
            <Route path={AppRoutes.engineVibration.href} element={<EngineVibrationInfo />} />
            <Route path="*" element={<>Coming soon... </>} />
        </Routes>)
}