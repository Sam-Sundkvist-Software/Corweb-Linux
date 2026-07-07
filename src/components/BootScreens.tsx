import React, { useState, useEffect, useRef } from "react";
import { Power, RefreshCcw, ShieldAlert, Cpu, HardDrive, KeyRound, Monitor, Info } from "lucide-react";
import { BootloaderPhase } from "../types/os";

// ==========================================
// 1. DETAILED DMESG BOOT SCREEN
// ==========================================
interface DetailedBootScreenProps {
	logs: string[];
	bootLoaderPhase?: BootloaderPhase;
	availableKernels?: { id: string; name: string; entry: string; version: string }[];
	selectedKernelId?: string;
	onSelectKernel?: (id: string) => void;
}

export function DetailedBootScreen({
	logs,
	bootLoaderPhase = BootloaderPhase.HARDWARE,
	availableKernels = [],
	selectedKernelId = "secure",
	onSelectKernel,
}: DetailedBootScreenProps) {
	const terminalEndRef = useRef<HTMLDivElement>(null);
	const [countdown, setCountdown] = useState(5);
	const [activeSelection, setActiveSelection] = useState<string>("secure");

	useEffect(() => {
		setActiveSelection(selectedKernelId);
	}, [selectedKernelId]);

	useEffect(() => {
		terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [logs]);

	useEffect(() => {
		if (bootLoaderPhase !== BootloaderPhase.HARDWARE) return;
		const interval = setInterval(() => {
			setCountdown((prev) => {
				if (prev <= 1) {
					clearInterval(interval);
					onSelectKernel?.(activeSelection || "secure");
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
		return () => clearInterval(interval);
	}, [bootLoaderPhase, activeSelection, onSelectKernel]);

	useEffect(() => {
		if (bootLoaderPhase !== BootloaderPhase.HARDWARE) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "1") {
				setActiveSelection("secure");
			} else if (e.key === "2") {
				setActiveSelection("xsi");
			} else if (e.key === "3") {
				setActiveSelection("fob");
			} else if (e.key === "Enter") {
				onSelectKernel?.(activeSelection);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [bootLoaderPhase, activeSelection, onSelectKernel]);

	if (bootLoaderPhase === BootloaderPhase.HARDWARE) {
		return (
			<div className="tlnx-boot-loader">
				<div className="tlnx-loader-content">
					{/* Header */}
					<div className="tlnx-loader-header">
						<div className="tlnx-loader-brand">
							<Cpu className="w-6 h-6" />
							<h1 className="tlnx-loader-title">
								Corweb Loader 1.0
							</h1>
						</div>
						<p className="tlnx-loader-subtitle">
							Boot-time kernel manager
						</p>
					</div>

					{/* Menu */}
					<div className="tlnx-loader-menu-container">
						<p className="tlnx-loader-menu-prompt">
							Please select a kernel
						</p>

						<div className="tlnx-loader-menu-box">
							{availableKernels.map((kernel, index) => {
								const isSelected = activeSelection === kernel.id;
								return (
									<button
										key={kernel.id}
										type="button"
										onClick={() => {
											setActiveSelection(kernel.id);
											onSelectKernel?.(kernel.id);
										}}
										className={`tlnx-loader-menu-item ${isSelected ? "tlnx-selected" : ""}`}
									>
										<div className="tlnx-item-label">
											<span className="tlnx-item-index">[{index + 1}]</span>
											<span className="tlnx-item-name">{kernel.name}</span>
										</div>
										<div className="tlnx-item-meta">
											entry: {kernel.entry} // v{kernel.version}
										</div>
									</button>
								);
							})}
						</div>
					</div>

					{/* Feedback */}
					<div className="tlnx-loader-feedback">
						<p className="tlnx-loader-countdown">
							Automatic boot of standard target in {countdown} seconds...
						</p>
						<p className="tlnx-loader-hint">
							Press [ENTER] to boot the selected target.
						</p>
					</div>
				</div>

				{/* Footer */}
				<div className="tlnx-loader-footer">
					Copyright (C) Samsoft 2026
				</div>
			</div>
		);
	}

	return (
		<div className="tlnx-boot-screen">
			{/* Top Banner */}
			<div className="tlnx-boot-header">
				<div className="tlnx-boot-title-box">
					<Monitor className="w-5 h-5 text-red-500 animate-pulse" />
					<span className="tlnx-boot-title">
						{activeSelection === "xsi" 
							? "XSI Boot: Loading Advanced IPC Isolation Kernels..." 
							: activeSelection === "fob" 
							? "FOB Boot: Spawning Lightweight Core Minimal Container..." 
							: "LILO Boot: loading trashlinux........................"}
					</span>
				</div>
				<div className="tlnx-boot-meta">
					<Cpu className="w-3.5 h-3.5" />
					<span>simdev: /dev/hda1 [FLAVOR: {activeSelection.toUpperCase()}]</span>
				</div>
			</div>

			{/* Scrolling Log Stream */}
			<div className="tlnx-boot-log-stream">
				{logs.map((log, index) => (
					<div key={index} className="whitespace-pre-wrap">
						{log}
					</div>
				))}
				{logs.length > 0 && (
					<div className="tlnx-boot-log-cursor-box">
						<span>▋</span>
						<span className="tlnx-boot-log-cursor-text">Spawning background daemons...</span>
					</div>
				)}
				<div ref={terminalEndRef} />
			</div>

			{/* Centered Spinner HUD */}
			<div className="tlnx-boot-spinner-hud">
				<div className="tlnx-boot-spinner-dots">
					<span />
					<span />
					<span />
				</div>
				<div className="tlnx-boot-spinner-label">
					TRASH LINUX v0.04a [BOOT FLAVOR: {activeSelection.toUpperCase()}]
				</div>
			</div>
		</div>
	);
}

// ==========================================
// 1.5 RETRO DOUBLE-BEVEL DIALOG OUTLINES
// ==========================================
interface GnomeDialogProps {
	title: string;
	message: string;
	type: "error" | "info" | "success";
	onClose: () => void;
}

export function GnomeDialog({ title, message, type, onClose }: GnomeDialogProps) {
	return (
		<div className="tlnx-gnome-dialog-overlay">
			<div 
				id="trash_alert_dialog"
				className="tlnx-gnome-dialog"
			>
				<div className="tlnx-gnome-dialog-header">
					<span className="tlnx-gnome-dialog-title">
						{type === "error" ? "🛑" : type === "success" ? "⭐" : "💾"} {title}
					</span>
					<button 
						onClick={onClose}
						className="tlnx-gnome-dialog-close-btn"
					>
						✕
					</button>
				</div>

				<div className="tlnx-gnome-dialog-body">
					<div className="tlnx-gnome-dialog-icon">
						{type === "error" ? (
							<ShieldAlert className="w-8 h-8 text-[#ff4500]" />
						) : (
							<Info className="w-8 h-8 text-[#002080]" />
						)}
					</div>
					<p className="tlnx-gnome-dialog-msg">
						{message}
					</p>
				</div>

				<div className="tlnx-gnome-dialog-footer">
					<button
						onClick={onClose}
						className="tlnx-gnome-dialog-ok-btn"
					>
						OK
					</button>
				</div>
			</div>
		</div>
	);
}

interface GnomeDiagnosticsDialogProps {
	testResults: { name: string; passed: boolean; message: string }[];
	testsPassed: boolean;
	onReplay: () => void;
	onClose: () => void;
}

export function GnomeDiagnosticsDialog({ testResults, testsPassed, onReplay, onClose }: GnomeDiagnosticsDialogProps) {
	return (
		<div className="tlnx-gnome-dialog-overlay">
			<div 
				id="trash_diag_window"
				className="tlnx-gnome-diag-window"
			>
				<div className="tlnx-gnome-diag-header">
					<span>
						🔬 Security Unit Tests Diagnostics
					</span>
					<button 
						onClick={onClose}
					>
						✕
					</button>
				</div>

				<div className="tlnx-gnome-diag-body">
					<div className="tlnx-gnome-diag-title-row">
						<span className="tlnx-diag-section">Dynamic Authentication Assertions</span>
						<span className={`tlnx-diag-badge ${testsPassed ? "tlnx-success" : "tlnx-failure"}`}>
							{testsPassed ? "5/5 CERTIFIED" : "FAILURES DETECTED"}
						</span>
					</div>

					<div className="tlnx-gnome-diag-list">
						{testResults.map((test, idx) => (
							<div key={idx} className="tlnx-gnome-diag-item">
								<span className="tlnx-test-name">{test.name}</span>
								<div className="tlnx-test-result-box">
									<span className="tlnx-test-msg">{test.message}</span>
									<span className={`tlnx-test-status ${test.passed ? "tlnx-pass" : "tlnx-fail"}`}>
										[{test.passed ? "PASS" : "FAIL"}]
									</span>
								</div>
							</div>
						))}
					</div>

					<p className="tlnx-gnome-diag-footer-note">
						* These dynamic unit assertions sweep standard user log-in sessions, file-write constraints, role definitions, and sandbox containment locks.
					</p>
				</div>

				<div className="tlnx-gnome-diag-footer">
					<button
						type="button"
						onClick={onReplay}
						className="tlnx-diag-action-btn"
					>
						<span>🔄 Re-run Tests</span>
					</button>
					
					<button
						type="button"
						onClick={onClose}
						className="tlnx-diag-close-btn"
					>
						Close Diagnostics
					</button>
				</div>
			</div>
		</div>
	);
}

interface GnomeInstructionsDialogProps {
	onClose: () => void;
}

export function GnomeInstructionsDialog({ onClose }: GnomeInstructionsDialogProps) {
	return (
		<div className="tlnx-gnome-dialog-overlay">
			<div 
				id="trash_instructions_window"
				className="tlnx-gnome-instructions-window"
			>
				<div className="tlnx-gnome-instr-header">
					<span>
						💾 TrashLinux Password Guidelines
					</span>
					<button 
						onClick={onClose}
					>
						✕
					</button>
				</div>

				<div className="tlnx-gnome-instr-body">
					<p className="tlnx-instr-section-title">DEFAULT PRE-CONFIGURED ACCOUNTS:</p>
					<div className="tlnx-instr-accounts-list">
						<div className="tlnx-instr-account-item">
							<span className="tlnx-uname-root">root (Sys Administrator)</span>
							<span className="tlnx-pwd-box">passwd: <code>root</code></span>
						</div>
						<div className="tlnx-instr-account-item">
							<span className="tlnx-uname-tux">tux (Linux operator)</span>
							<span className="tlnx-pwd-box">passwd: <code>tux</code></span>
						</div>
						<div className="tlnx-instr-account-item tlnx-guest">
							<span className="tlnx-guest-badge">guest (Bypass profile)</span>
							<span className="tlnx-pwd-box">One-Click Login Bypass</span>
						</div>
					</div>
					<p className="tlnx-instr-tips-box">
						💡 Sandbox safety guidelines: TrashLinux does not persist any external credential variables. If custom logins cause database conflicts, click "Hard Reset VFS" at the bottom to flush the workspace cleanly.
					</p>
				</div>

				<div className="tlnx-gnome-instr-footer">
					<button
						type="button"
						onClick={onClose}
						className="tlnx-instr-close-btn"
					>
						Closed
					</button>
				</div>
			</div>
		</div>
	);
}

// ==========================================
// 2. TRASHLINUX DISPLAY MANAGER CLASSIC GDM
// ==========================================
interface GdmLoginScreenProps {
	onLogin: (u: string, p: string) => boolean;
	onReboot: () => void;
	getUsers: () => { username: string; fullName: string; role: string; avatar: string }[];
	testAuthentication?: () => { name: string; passed: boolean; message: string }[];
}

export function GdmLoginScreen({
	onLogin,
	onReboot,
	getUsers,
	testAuthentication,
}: GdmLoginScreenProps) {
	const [selectedUser, setSelectedUser] = useState<any | null>(null);
	const [customUsername, setCustomUsername] = useState("");
	const [showOtherInput, setShowOtherInput] = useState(false);
	const [password, setPassword] = useState("");
	const [userAccounts, setUserAccounts] = useState<any[]>([]);

	// Modal alert dialog states
	const [alertModal, setAlertModal] = useState<{ title: string; message: string; type: "error" | "info" | "success" } | null>(null);
	const [showDiagnostics, setShowDiagnostics] = useState(false);
	const [showInstructions, setShowInstructions] = useState(false);

	// Automated core diagnostics status
	const [testResults, setTestResults] = useState<any[]>([]);
	const [testsPassed, setTestsPassed] = useState<boolean>(true);

	useEffect(() => {
		try {
			const dbUsers = getUsers();
			if (dbUsers && dbUsers.length > 0) {
				setUserAccounts(dbUsers);
			} else {
				throw new Error("No database records discovered");
			}
		} catch {
			// Fallback initial structures
			setUserAccounts([
				{ username: "guest", fullName: "Regular Guest Session", role: "user", avatar: "guest" },
				{ username: "tux", fullName: "Tux Linux Operator", role: "admin", avatar: "penguin" },
				{ username: "root", fullName: "Sys Administrator", role: "root", avatar: "system" }
			]);
		}
	}, [getUsers]);

	useEffect(() => {
		if (testAuthentication) {
			try {
				const results = testAuthentication();
				setTestResults(results);
				setTestsPassed(results.length > 0 && results.every((r) => r.passed));
			} catch (e) {
				console.error("Failed to run dynamic kernel auth unit tests:", e);
			}
		}
	}, [testAuthentication]);

	const handleRunTestsManually = () => {
		if (testAuthentication) {
			try {
				const results = testAuthentication();
				setTestResults(results);
				setTestsPassed(results.length > 0 && results.every((r) => r.passed));
			} catch (e) {
				console.error("Test execution aborted:", e);
			}
		}
	};

	const triggerAlert = (title: string, message: string, type: "error" | "info" | "success" = "error") => {
		setAlertModal({ title, message, type });
	};

	const handleSelectUser = (user: any) => {
		if (user.username === "guest") {
			const ok = onLogin("guest", "");
			if (!ok) {
				triggerAlert("Session Fail", "Failed to establish guest session.");
			}
			return;
		}
		setSelectedUser(user);
		setShowOtherInput(false);
		setPassword("");
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		let username = "";
		if (showOtherInput) {
			username = customUsername.trim().toLowerCase();
		} else if (selectedUser) {
			username = selectedUser.username;
		} else {
			triggerAlert("Selection Required", "Please choose a user session profile.");
			return;
		}

		if (!username) {
			triggerAlert("Validation Alert", "Please enter an account username.");
			return;
		}

		const ok = onLogin(username, password);
		if (!ok) {
			triggerAlert("Authentication Error", "Credentials mismatched relative to standard stored user scopes.");
		}
	};

	// Filter out any duplicating "guest" records in list loop
	const filteredUsers = userAccounts.filter(u => u.username !== "guest");

	return (
		<div className="tlnx-gdm-screen">
			
			{/* Dynamic Alerts Dialog overlays */}
			{alertModal && (
				<GnomeDialog
					title={alertModal.title}
					message={alertModal.message}
					type={alertModal.type}
					onClose={() => setAlertModal(null)}
				/>
			)}

			{showDiagnostics && (
				<GnomeDiagnosticsDialog
					testResults={testResults}
					testsPassed={testsPassed}
					onReplay={handleRunTestsManually}
					onClose={() => setShowDiagnostics(false)}
				/>
			)}

			{showInstructions && (
				<GnomeInstructionsDialog
					onClose={() => setShowInstructions(false)}
				/>
			)}

			{/* Top bar */}
			<div className="tlnx-gdm-topbar">
				<span className="tlnx-gdm-topbar-brand">
					<span>⚙️</span>
					<span>TLDM: TrashLinux Display Greeter v0.04a</span>
				</span>
				<div className="tlnx-gdm-topbar-actions">
					<span>CONSOLE TTY1</span>
					<span className="tlnx-gdm-stable-badge">STABLE</span>
				</div>
			</div>

			{/* Main card box */}
			<div className="tlnx-gdm-card">
				{/* Clay visual strip */}
				<div className="tlnx-gdm-clay-strip" />

				{/* Vintage Trash Logo */}
				<div className="tlnx-gdm-logo-section">
					<div className="tlnx-gdm-logo">
						🗑️
					</div>
					<h2>trashlinux</h2>
					<span>Dumpster Fire Sandbox Core (v0.04a)</span>
				</div>

				<form onSubmit={handleSubmit} className="tlnx-gdm-form">

					{/* USER SELECTION PANEL */}
					{!selectedUser && !showOtherInput ? (
						<div className="tlnx-gdm-user-section">
							<span className="tlnx-gdm-section-label">SELECT USER SESSION:</span>
							<div className="tlnx-gdm-user-list">
								
								{/* ONE-CLICK GUEST BYPASS ACTION */}
								<button
									id="list_instant_guest_bypass"
									type="button"
									onClick={() => {
										const ok = onLogin("guest", "");
										if (!ok) {
											triggerAlert("Session Fail", "Failed to establish guest session.");
										}
									}}
									className="tlnx-gdm-guest-bypass-btn"
								>
									<div className="tlnx-bypass-label">
										<span className="text-sm">⚡</span>
										<div>
											<p className="tlnx-bypass-title">Quick Guest Login</p>
											<p className="tlnx-bypass-desc">No password required</p>
										</div>
									</div>
									<span className="tlnx-bypass-tag">bypass</span>
								</button>

								{/* USER ACCOUNTS */}
								{filteredUsers.map((user) => (
									<button
										key={user.username}
										type="button"
										onClick={() => handleSelectUser(user)}
										className="tlnx-gdm-user-item"
									>
										<div className="tlnx-user-label">
											<span className="text-sm">
												{user.avatar === "penguin" ? "🐧" : user.avatar === "system" ? "⚙️" : "👤"}
											</span>
											<div>
												<p className="tlnx-user-fullname">{user.fullName}</p>
												<p className="tlnx-user-uname">uname: {user.username}</p>
											</div>
										</div>
										<span className="tlnx-user-role-badge">{user.role}</span>
									</button>
								))}

								{/* OTHER MANUALLY TYPE TRIGGER */}
								<button
									type="button"
									onClick={() => {
										setShowOtherInput(true);
										setSelectedUser(null);
										setCustomUsername("");
										setPassword("");
									}}
									className="tlnx-gdm-other-user-btn"
								>
									Other Console Account...
								</button>
							</div>
						</div>
					) : (
						<div className="tlnx-gdm-login-active-box">
							{/* Chosen profile strip */}
							<div className="tlnx-gdm-chosen-profile">
								<div className="tlnx-profile-details">
									<span className="text-sm">👤</span>
									<div>
										<span className="tlnx-profile-name">
											{showOtherInput ? "Other Console Session" : selectedUser?.fullName}
										</span>
										<span className="tlnx-profile-uname">
											username: {showOtherInput ? customUsername || "none" : selectedUser?.username}
										</span>
									</div>
								</div>
								<button
									type="button"
									onClick={() => {
										setSelectedUser(null);
										setShowOtherInput(false);
										setPassword("");
									}}
									className="tlnx-gdm-exit-profile-btn"
								>
									[Exit]
								</button>
							</div>

							{showOtherInput && (
								<div className="tlnx-gdm-input-group">
									<label htmlFor="custom_uname">ACCOUNT USERNAME:</label>
									<input
										id="custom_uname"
										type="text"
										placeholder="lowercase username"
										value={customUsername}
										onChange={(e) => setCustomUsername(e.target.value)}
										autoFocus
									/>
								</div>
							)}

							<div className="tlnx-gdm-input-group">
								<label htmlFor="passwd_input">ACCOUNT PASSWORD:</label>
								<div className="tlnx-input-pwd-wrapper">
									<input
										id="passwd_input"
										type="password"
										placeholder="blank or same as username"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										autoFocus={!showOtherInput}
									/>
									<KeyRound />
								</div>
							</div>

							<button
								type="submit"
								className="tlnx-gdm-submit-btn"
							>
								UNMOCK SESSION AND BOOT WEBOS
							</button>
						</div>
					)}

					{/* Compact bottom grid helper buttons */}
					<div className="tlnx-gdm-helper-grid">
						<button
							type="button"
							onClick={() => setShowDiagnostics(true)}
							className="tlnx-gdm-helper-btn"
						>
							🔬 Diagnostics ({testsPassed ? "Ok" : "Fail"})
						</button>
						<button
							type="button"
							onClick={() => setShowInstructions(true)}
							className="tlnx-gdm-helper-btn"
						>
							ℹ️ Logins Guide
						</button>
					</div>

				</form>
			</div>

			{/* Footer bar */}
			<div className="tlnx-gdm-footer">
				<div className="tlnx-gdm-footer-actions">
					<button
						onClick={() => {
							if (confirm("Disconnect and turn off virtualization?")) {
								window.close();
							}
						}}
						className="tlnx-gdm-footer-action-btn"
					>
						<Power className="w-3 h-3 tlnx-red" />
						<span>Power Off</span>
					</button>
					<button
						onClick={onReboot}
						className="tlnx-gdm-footer-action-btn"
					>
						<RefreshCcw className="w-3 h-3 tlnx-green" />
						<span>Restart Hardware</span>
					</button>
					<button
						onClick={() => {
							if (confirm("CRITICAL WARNING: This will immediately purge IndexedDB, resetting all custom VFS files, hostname updates, password edits, and configuration details. Proceed?")) {
								try {
									indexedDB.deleteDatabase("Linux2006WebOS_DB");
									setTimeout(() => {
										window.location.reload();
									}, 500);
								} catch (err: any) {
									alert("Failed to purge DB: " + err.message);
								}
							}
						}}
						className="tlnx-gdm-footer-action-btn tlnx-clean-db-btn"
						title="Wipe IndexedDB database and reboot standard configuration"
					>
						<span>🗑️ Clean VFS DB</span>
					</button>
				</div>
				<span className="tlnx-gdm-footer-text">TrashLinux Host VFS Simulator v0.04a</span>
			</div>
		</div>
	);
}


// ==========================================
// 3. KERNEL PANIC SCREEN (CRITICAL DISASTER RECOVERY)
// ==========================================
interface KernelPanicScreenProps {
	reason: string;
	onReboot: () => void;
}

export function KernelPanicScreen({ reason, onReboot }: KernelPanicScreenProps) {
	const [ledState, setLedState] = useState(true);

	useEffect(() => {
		const int = setInterval(() => {
			setLedState((prev) => !prev);
		}, 400);
		return () => clearInterval(int);
	}, []);

	// Parse the reason and stack trace
	let primaryReason = reason || "Unknown critical kernel boundary fault.";
	let stackTrace = "";

	if (reason && reason.includes("STACK_TRACE:")) {
		const parts = reason.split("STACK_TRACE:");
		primaryReason = parts[0].trim();
		stackTrace = parts[1].trim();
	}

	// If stackTrace wasn't supplied, output a simulated but beautiful stack trace
	if (!stackTrace) {
		stackTrace = `Error: System integrity violation at SecureKernel.init
		at initializeSyscallParameter (secureKernel.ts:634:11)
		at Object.getSyscallToken (secureKernel.ts:664:14)
		at Desktop.tsx:288:42
		at launchApp (useWebOS.tsx:472:25)
		at HTMLButtonElement.onClick (Desktop.tsx:478:29)
		at invokeReactEventHandler (react-dom.production.min.js:23:441)
		at dispatchEvent (react-dom.production.min.js:23:1003)`;
	}

	// Generate simulated register values
	const registerDump = `EAX: 0x00FF8C1E  EBX: 0xFF900D8C  ECX: 0x0000003F  EDX: 0x002B4F6D
ESI: 0x004A92E1  EDI: 0x005E21FA  EBP: 0xFFEF901B  ESP: 0xFFEF9000
CS: 0x0008  DS: 0x0010  SS: 0x0010  ES: 0x0010  FS: 0x0033  GS: 0x003B
CR0: 0x80050033  CR2: 0x00103E4A  CR3: 0x00201000  EFLAGS: 0x00010246`;

	return (
		<div className="tlnx-kernel-panic-screen">
			
			{/* LED indicators simulated overlay */}
			<div className="tlnx-panic-header">
				<div className="tlnx-panic-title-box">
					<ShieldAlert className="w-8 h-8 text-white animate-bounce shrink-0" />
					<div className="tlnx-panic-title-content">
						<h1>
							TRASHLINUX FATAL EXCEPTION OCCURRED
						</h1>
						<p>
							SYSTEM INTEGRITY EXCEPTION // EXCEPTION CODE: 0xDEADBEEF
						</p>
					</div>
				</div>

				<div className="tlnx-panic-leds">
					<span>HARDWARE KEYBOARD LEDS:</span>
					<div className="tlnx-led-box">
						<span className="tlnx-led-item">
							<span className={`tlnx-led-dot ${ledState ? "tlnx-active" : "tlnx-inactive"}`} />
							<span className="tlnx-led-label">CAPS</span>
						</span>
						<span className="tlnx-led-item">
							<span className={`tlnx-led-dot ${!ledState ? "tlnx-active" : "tlnx-inactive"}`} />
							<span className="tlnx-led-label">SCROLL</span>
						</span>
					</div>
				</div>
			</div>

			<div className="tlnx-panic-body">
				<p className="tlnx-panic-intro">
					A fatal instruction was executed or a corrupt virtual memory state was encountered inside the secure Ring 0 kernel context line. 
					Execution has been suspended to prevent page corruption, loss of user VFS files, or unauthorized system state alterations.
				</p>

				{/* Diagnostic parameters display */}
				<div className="tlnx-panic-blocks-grid">
					
					{/* Main Error */}
					<div className="tlnx-panic-block">
						<div>
							<span className="tlnx-block-label">
								Primary Panic Description:
							</span>
							<p className="tlnx-block-content">
								{primaryReason}
							</p>
						</div>
						<div className="tlnx-block-footer">
							FAULTING MODULE: secureKernel.ts // SYSTEM_CALL_CONDUIT: [int 0x80]
						</div>
					</div>

					{/* Processor details */}
					<div className="tlnx-panic-dump">
						<span className="tlnx-dump-label">
							Active Virtual Registers Dump:
						</span>
						<pre>
							{registerDump}
						</pre>
					</div>
				</div>

				{/* Backtrace details */}
				<div className="tlnx-panic-backtrace-section">
					<span className="tlnx-backtrace-label">
						Active Exception Call Backtrace (D3-DUMP):
					</span>
					<div className="tlnx-panic-backtrace-box">
						<pre>
							{stackTrace}
						</pre>
					</div>
				</div>

				{/* Mitigation procedures */}
				<div className="tlnx-panic-procedures">
					<p className="tlnx-procedures-title">Standard Recovery Procedures:</p>
					<ul>
						<li>Check file permissions within <span className="tlnx-bold-underline">/etc/sysconfig.json</span> and recover lost parameters.</li>
						<li>Maintain memory allocation buffers using the <span className="tlnx-bold">App Registry Manager</span> or clear leak vectors.</li>
						<li>In case of recurring panics, use the terminal <span className="tlnx-bold font-mono">panic</span> trigger parameters to analyze syscall boundaries.</li>
					</ul>
				</div>
			</div>

			{/* Shutdown action controls */}
			<div className="tlnx-panic-footer">
				<p className="tlnx-panic-footer-hint">
					If this is the first time you are seeing this layout screen, press the reboot trigger button. 
					The local volume storage (VFS) cache is stored securely in memory and committed on graceful restarts.
				</p>

				<button
					onClick={onReboot}
					className="tlnx-panic-reboot-btn"
				>
					<Power className="w-4 h-4 text-red-800 animate-spin" />
					<span>Cold System Reboot</span>
				</button>
			</div>
		</div>
	);
}
