"use client";

type BackButtonProps = {
  fallback: string;
  label?: string;
  variant?: "ghost" | "pill";
};

export function BackButton({
  fallback,
  label = "Kembali",
  variant = "ghost",
}: BackButtonProps) {
  const navigate = () => {
    if ((window.history.state?.idx ?? 0) > 0) {
      window.history.back();
      return;
    }
    window.history.replaceState({ ...(window.history.state || {}), idx: 0 }, "", fallback);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleBack = () => {
    const event = new CustomEvent("wikiflow:before-back", {
      cancelable: true,
      detail: { proceed: navigate },
    });
    if (window.dispatchEvent(event)) navigate();
  };

  return (
    <button
      type="button"
      className={`back-button ${variant}`}
      onClick={handleBack}
      aria-label={`Kembali ke ${fallback}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m15 18-6-6 6-6" />
        <path d="M9 12h11" />
      </svg>
      <span>{label}</span>
    </button>
  );
}