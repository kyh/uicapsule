import ReactGA from "react-ga4";

export enum EventCategory {
	User = "User",
	Landing = "Landing",
	Pricing = "Pricing",
	Documentation = "Documentation",
	External = "External",
}

export const trackEvent = (args: { action: string; category: EventCategory; label?: string }) => {
	ReactGA.event(args);
};
