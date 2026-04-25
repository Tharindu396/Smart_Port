"use client";

import { DashboardLayout } from "@/app/components/DashboardLayout";
import { Button, Card, Chip, ProgressBar as Progress } from "@heroui/react";
import {
	Anchor,
	ArrowRight,
	CalendarClock,
	CheckCircle2,
	Clock3,
	Container,
	LoaderCircle,
	Ship,
	Waves,
} from "lucide-react";

type BerthStatus = "occupied" | "assigned" | "available" | "maintenance";

const summary = [
	{
		label: "Berths Occupied",
		value: "8 / 12",
		detail: "67% live utilization",
		icon: Anchor,
		color: "text-primary",
	},
	{
		label: "Vessels In Queue",
		value: "6",
		detail: "2 priority arrivals",
		icon: Ship,
		color: "text-warning",
	},
	{
		label: "Avg Berth Turnaround",
		value: "5.4h",
		detail: "-18m from yesterday",
		icon: Clock3,
		color: "text-success",
	},
	{
		label: "Allocation Confidence",
		value: "93%",
		detail: "Rules + weather + tide",
		icon: CheckCircle2,
		color: "text-secondary",
	},
];

const berthSlots: Array<{
	berth: string;
	terminal: string;
	status: BerthStatus;
	vessel: string;
	operation: string;
	etaOrEtd: string;
	loaLimit: string;
	draft: string;
	progress: number;
}> = [
	{
		berth: "B-01",
		terminal: "Container North",
		status: "occupied",
		vessel: "MV Atlas Crown",
		operation: "Unloading containers",
		etaOrEtd: "ETD 15:40",
		loaLimit: "350m",
		draft: "15.0m",
		progress: 72,
	},
	{
		berth: "B-02",
		terminal: "Container North",
		status: "assigned",
		vessel: "MS Blue Pelican",
		operation: "Pilot boarding",
		etaOrEtd: "ETA 13:20",
		loaLimit: "330m",
		draft: "14.2m",
		progress: 45,
	},
	{
		berth: "B-03",
		terminal: "Bulk East",
		status: "available",
		vessel: "Awaiting assignment",
		operation: "Ready for dry bulk",
		etaOrEtd: "Open slot",
		loaLimit: "290m",
		draft: "13.5m",
		progress: 0,
	},
	{
		berth: "B-04",
		terminal: "Energy South",
		status: "maintenance",
		vessel: "N/A",
		operation: "Fender inspection",
		etaOrEtd: "Available 18:00",
		loaLimit: "310m",
		draft: "14.0m",
		progress: 58,
	},
	{
		berth: "B-05",
		terminal: "General Cargo",
		status: "occupied",
		vessel: "MV Sterling Bay",
		operation: "Mixed cargo loading",
		etaOrEtd: "ETD 16:10",
		loaLimit: "280m",
		draft: "12.8m",
		progress: 64,
	},
	{
		berth: "B-06",
		terminal: "General Cargo",
		status: "assigned",
		vessel: "MV Pacific Reef",
		operation: "Final tug confirmation",
		etaOrEtd: "ETA 14:05",
		loaLimit: "275m",
		draft: "12.6m",
		progress: 36,
	},
];

const waitingQueue = [
	{
		vessel: "Ocean Meridian",
		cargo: "Reefer Containers",
		priority: "High",
		eta: "13:50",
		suggestedBerth: "B-03",
	},
	{
		vessel: "Arctic Lantern",
		cargo: "Steel Coils",
		priority: "Medium",
		eta: "14:25",
		suggestedBerth: "B-06",
	},
	{
		vessel: "Delta Horizon",
		cargo: "LNG Support",
		priority: "High",
		eta: "15:05",
		suggestedBerth: "B-08",
	},
	{
		vessel: "Coral Zenith",
		cargo: "Project Cargo",
		priority: "Low",
		eta: "16:10",
		suggestedBerth: "B-09",
	},
];

const shiftEvents = [
	{ time: "12:30", event: "B-02 tug allocated", tone: "primary" },
	{ time: "13:00", event: "B-01 crane set 4 enabled", tone: "success" },
	{ time: "13:30", event: "Tide window opens (+1.2m)", tone: "warning" },
	{ time: "14:00", event: "B-03 reserved for reefer priority", tone: "primary" },
	{ time: "15:00", event: "B-04 inspection checkpoint", tone: "default" },
];

function getStatusChip(status: BerthStatus) {
	if (status === "occupied") return <Chip variant="primary">Occupied</Chip>;
	if (status === "assigned") return <Chip color="success">Assigned</Chip>;
	if (status === "maintenance") return <Chip color="warning">Maintenance</Chip>;
	return <Chip variant="soft">Available</Chip>;
}

function getProgressColor(status: BerthStatus): "accent" | "success" | "warning" | "default" {
	if (status === "occupied") return "accent";
	if (status === "assigned") return "success";
	if (status === "maintenance") return "warning";
	return "default";
}

export default function BerthPage() {
	return (
		<DashboardLayout defaultActiveKey="berths" pageTitle="Berth Allocation">
			<section className="space-y-6">
				<header className="rounded-2xl border border-divider bg-linear-to-r from-content2 via-content1 to-primary/5 p-5 md:p-6">
					<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
						<div className="space-y-2">
							<div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
								<Waves size={14} />
								Live Marine Operations
							</div>
							<h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Berth Allocation Control</h2>
							<p className="max-w-2xl text-sm text-default-500 md:text-base">
								Assign berths with rule-aware recommendations based on vessel size, cargo type, draft, and live
								terminal load.
							</p>
						</div>

						<div className="flex flex-wrap gap-2">
							<Button variant="secondary">
                                <CalendarClock size={15} />
								View 24h Plan
							</Button>
							<Button variant="primary" >
								Run Auto Allocation
                                <ArrowRight size={15} />
							</Button>
						</div>
					</div>
				</header>

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
					{summary.map((item) => {
						const Icon = item.icon;
						return (
							<Card key={item.label} className="bg-linear-to-br from-content2 to-content1">
								<Card.Content className="space-y-3">
									<div className="flex items-start justify-between gap-3">
										<div>
											<p className="text-xs font-medium uppercase tracking-wide text-default-500">{item.label}</p>
											<p className="mt-1 text-2xl font-bold">{item.value}</p>
										</div>
										<div className="rounded-lg bg-content3 p-2">
											<Icon size={18} className={item.color} />
										</div>
									</div>
									<p className="text-xs text-default-500">{item.detail}</p>
								</Card.Content>
							</Card>
						);
					})}
				</div>

				<div className="grid grid-cols-1 gap-6 2xl:grid-cols-3">
					<Card className="2xl:col-span-2">
						<Card.Header className="flex items-center justify-between gap-3">
							<div>
								<Card.Title>Berth Slots</Card.Title>
								<Card.Description>Current occupancy, assignment state, and operational progress</Card.Description>
							</div>
							<Chip color="success" variant="soft">
								12 Active Berths
							</Chip>
						</Card.Header>

						<Card.Content className="space-y-3">
							{berthSlots.map((slot) => (
								<div
									key={slot.berth}
									className="rounded-xl border border-divider bg-content2/40 p-4 transition-colors hover:bg-content2"
								>
									<div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
										<div className="space-y-1">
											<div className="flex items-center gap-2">
												<p className="text-base font-semibold">{slot.berth}</p>
												<Chip size="sm" variant="soft">
													{slot.terminal}
												</Chip>
											</div>
											<p className="text-sm text-default-600">{slot.vessel}</p>
										</div>

										<div className="flex items-center gap-2">{getStatusChip(slot.status)}</div>
									</div>

									<div className="grid grid-cols-2 gap-3 text-sm lg:grid-cols-5">
										<div>
											<p className="text-xs text-default-500">Operation</p>
											<p className="font-medium">{slot.operation}</p>
										</div>
										<div>
											<p className="text-xs text-default-500">Schedule</p>
											<p className="font-medium">{slot.etaOrEtd}</p>
										</div>
										<div>
											<p className="text-xs text-default-500">LOA Limit</p>
											<p className="font-medium">{slot.loaLimit}</p>
										</div>
										<div>
											<p className="text-xs text-default-500">Max Draft</p>
											<p className="font-medium">{slot.draft}</p>
										</div>
										<div>
											<p className="text-xs text-default-500">Progress</p>
											<p className="font-medium">{slot.progress}%</p>
										</div>
									</div>

									<div className="mt-3">
										<Progress
											value={slot.progress}
											color={getProgressColor(slot.status)}
											className="h-2"
											aria-label={`${slot.berth} progress`}
										/>
									</div>
								</div>
							))}
						</Card.Content>
					</Card>

					<div className="space-y-4">
						<Card>
							<Card.Header>
								<Card.Title>Waiting Queue</Card.Title>
								<Card.Description>Upcoming arrivals pending final berth lock</Card.Description>
							</Card.Header>

							<Card.Content className="space-y-2">
								{waitingQueue.map((item) => (
									<div key={item.vessel} className="rounded-lg border border-divider p-3">
										<div className="mb-2 flex items-center justify-between gap-2">
											<p className="text-sm font-semibold">{item.vessel}</p>
											<Chip color={item.priority === "High" ? "danger" : item.priority === "Medium" ? "warning" : "default"}>
												{item.priority}
											</Chip>
										</div>
										<p className="text-xs text-default-500">{item.cargo}</p>
										<div className="mt-2 flex items-center justify-between text-xs text-default-600">
											<span>ETA {item.eta}</span>
											<span>Suggest {item.suggestedBerth}</span>
										</div>
									</div>
								))}
							</Card.Content>
						</Card>

						<Card className="bg-linear-to-br from-content1 to-warning/5">
							<Card.Header>
								<Card.Title>Shift Timeline</Card.Title>
								<Card.Description>Critical windows for this operational cycle</Card.Description>
							</Card.Header>

							<Card.Content className="space-y-3">
								{shiftEvents.map((event) => (
									<div key={`${event.time}-${event.event}`} className="flex items-start gap-3 rounded-lg border border-divider p-3">
										<div className="pt-1">
											<LoaderCircle
												size={14}
												className={
													event.tone === "success"
														? "text-success"
														: event.tone === "warning"
														? "text-warning"
														: event.tone === "primary"
														? "text-primary"
														: "text-default-500"
												}
											/>
										</div>
										<div className="min-w-0">
											<p className="text-xs text-default-500">{event.time}</p>
											<p className="text-sm font-medium leading-snug">{event.event}</p>
										</div>
									</div>
								))}
							</Card.Content>
						</Card>

						<Card className="border-l-2 border-l-primary">
							<Card.Content className="space-y-3">
								<p className="text-sm font-semibold">Allocation Rules Applied</p>
								<div className="space-y-2 text-xs text-default-600">
									<p className="flex items-center gap-2">
										<Container size={14} className="text-primary" />
										Cargo compatibility matrix by terminal
									</p>
									<p className="flex items-center gap-2">
										<Waves size={14} className="text-primary" />
										Draft and tide constraints for current window
									</p>
									<p className="flex items-center gap-2">
										<Ship size={14} className="text-primary" />
										LOA and tug availability scoring
									</p>
								</div>
								<Button size="sm" variant="secondary" fullWidth>
									Review Rule Set
								</Button>
							</Card.Content>
						</Card>
					</div>
				</div>
			</section>
		</DashboardLayout>
	);
}
