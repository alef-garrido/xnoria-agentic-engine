"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

interface SignalFiltersProps {
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    selectedDomain: string | "ALL";
    setSelectedDomain: (d: string | "ALL") => void;
    selectedCause: string | "ALL";
    setSelectedCause: (c: string | "ALL") => void;
    domains: { code: string; label: string }[];
    causes: { code: string; label: string }[];
}

const selectStyle: React.CSSProperties = {
    backgroundColor: "var(--card-elevated)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "14px",
    color: "var(--text-primary)",
    cursor: "pointer",
    minWidth: "200px",
    outline: "none",
    transition: "border-color 0.15s ease",
};

export function SignalFilters({
    searchQuery, setSearchQuery,
    selectedDomain, setSelectedDomain,
    selectedCause, setSelectedCause,
    domains, causes
}: SignalFiltersProps) {
    const t = useTranslations("cxtools");
    return (
        <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
                <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: "var(--text-muted)" }}
                />
                <input
                    type="text"
                    placeholder={t("searchSignal")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm focus:outline-none"
                    style={{
                        backgroundColor: "var(--card-elevated)",
                        border: "1px solid var(--border)",
                        color: "var(--text-primary)",
                        transition: "border-color 0.15s ease",
                    }}
                    onFocus={(e) => {
                        e.currentTarget.style.borderColor = "var(--accent)";
                    }}
                    onBlur={(e) => {
                        e.currentTarget.style.borderColor = "var(--border)";
                    }}
                />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
                <select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    style={selectStyle}
                    onFocus={(e) => {
                        e.currentTarget.style.borderColor = "var(--accent)";
                    }}
                    onBlur={(e) => {
                        e.currentTarget.style.borderColor = "var(--border)";
                    }}
                >
                    <option value="ALL">{t("allDomains")}</option>
                    {domains.map((d) => (
                        <option key={d.code} value={d.code}>
                            {d.label}
                        </option>
                    ))}
                </select>

                <select
                    value={selectedCause}
                    onChange={(e) => setSelectedCause(e.target.value)}
                    style={selectStyle}
                    onFocus={(e) => {
                        e.currentTarget.style.borderColor = "var(--accent)";
                    }}
                    onBlur={(e) => {
                        e.currentTarget.style.borderColor = "var(--border)";
                    }}
                >
                    <option value="ALL">{t("allCauses")}</option>
                    {causes.map((c) => (
                        <option key={c.code} value={c.code}>
                            {c.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
