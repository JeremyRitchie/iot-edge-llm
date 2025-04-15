import { TopNavigation, ButtonDropdownProps, FormField, Slider, Select, SelectProps } from "@cloudscape-design/components";
import { Mode } from '@cloudscape-design/global-styles';
// atoms
import { useAtom } from 'jotai';
import React from 'react';
import { AppName, themeAtom, toggleThemeAtom, temperatureAtom, topPAtom, modelAtom } from '../atoms/AppAtoms';
import { webSocketAtom } from '../atoms/WebSocketAtom';
import Favicon from "../assets/favicon.png"

export default function TopBar() {
    // atoms
    const [theme] = useAtom(themeAtom);
    const [, toggleTheme] = useAtom(toggleThemeAtom);
    const [webSocket] = useAtom(webSocketAtom);
    const [temperature, setTemperature] = useAtom(temperatureAtom);
    const [topP, setTopP] = useAtom(topPAtom);
    const [selectedModel, setSelectedModel] = useAtom(modelAtom);

    const handleSettingsClick = (detail: ButtonDropdownProps.ItemClickDetails) => {
        if (detail.id === "switch-theme") {
            toggleTheme();
        }
    }

    const handleTemperatureChange = (value: number) => {
        if (value >= 0 && value <= 1) {
            setTemperature(parseFloat(value.toFixed(1)));
        }
    }

    const handleTopPChange = (value: number) => {
        if (value >= 0 && value <= 1) {
            setTopP(parseFloat(value.toFixed(2)));
        }
    }

    const modelOptions: SelectProps.Option[] = [
        { value: "qwen3:1.7b", label: "Qwen3 (1.7B)" },
        { value: "gemma3:4b", label: "Gemma 3 (4B)" },
        { value: "gemma3:1b", label: "Gemma 3 (1B)" }

    ];

    // Simple handler to prevent clicks from closing the dropdown
    const preventClose = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const SliderItem = ({ label, value, onChange, min, max, step, description }: { 
        label: string;
        value: number;
        onChange: (value: number) => void;
        min: number;
        max: number;
        step: number;
        description?: string;
    }) => {
        return (
            <div style={{ padding: '8px 20px', minWidth: '250px' }} onClick={preventClose}>
                <FormField
                    label={label}
                    description={description}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ flex: 1 }}>
                            <Slider
                                value={value}
                                onChange={event => onChange(Number(event.detail.value))}
                                min={min}
                                max={max}
                                step={step}
                            />
                        </div>
                        <div style={{ minWidth: '40px', textAlign: 'right' }}>
                            {value}
                        </div>
                    </div>
                </FormField>
            </div>
        );
    };

    const ModelSelector = () => {
        return (
            <div style={{ padding: '8px 20px', minWidth: '250px' }} onClick={preventClose}>
                <FormField
                    label="Model"
                    description="Select the model to use for text generation"
                >
                    <Select
                        selectedOption={modelOptions.find(option => option.value === selectedModel) || modelOptions[0]}
                        onChange={({ detail }) => {
                            setSelectedModel(detail.selectedOption.value as string);
                        }}
                        options={modelOptions}
                    />
                </FormField>
            </div>
        );
    };

    return (
        <TopNavigation
            identity={{
                href: "/",
                title: AppName,
                logo: {
                    src: Favicon,
                    alt: "Raspberry Pi Localized LLMs"
                }
            }}
            utilities={[
                {
                    type: "menu-dropdown",
                    iconName: "settings",
                    ariaLabel: "Settings",
                    title: "Settings",
                    onItemClick: ({ detail }) => handleSettingsClick(detail),
                    items: [
                        {
                            id: "switch-theme",
                            text: theme === Mode.Light ? "🌙  Dark Theme" : "💡 Light Theme"
                        },
                        {
                            id: "model-selector",
                            text: <ModelSelector /> as unknown as string
                        },
                        {
                            id: "custom-temperature",
                            text: (
                                <SliderItem 
                                    label="Temperature"
                                    value={temperature}
                                    onChange={handleTemperatureChange}
                                    min={0}
                                    max={1}
                                    step={0.1}
                                    description="Controls randomness. Lower values are more deterministic, higher values more creative."
                                />
                            ) as unknown as string
                        },
                        {
                            id: "custom-top-p",
                            text: (
                                <SliderItem 
                                    label="Top P"
                                    value={topP}
                                    onChange={handleTopPChange}
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    description="Nucleus sampling - considers the smallest set of tokens whose probability sum is at least P."
                                />
                            ) as unknown as string
                        },
                        {
                            id: "websocket-status",
                            text: "WebSocket Status: " + webSocket.status
                        }
                    ]
                }
            ]}
            i18nStrings={{
                searchIconAriaLabel: "Search",
                searchDismissIconAriaLabel: "Close search",
                overflowMenuTriggerText: "More",
                overflowMenuTitleText: "All",
                overflowMenuBackIconAriaLabel: "Back",
                overflowMenuDismissIconAriaLabel: "Close menu"
            }}
        />
    )
}