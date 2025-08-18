"use client";
import Link from "next/link";
import Image from "next/image";
import React, { useState } from "react";

export default function SiteHeader() {
	const [logoSrc, setLogoSrc] = useState<string>("/marham-logo.svg");
	const [logoFailed, setLogoFailed] = useState<boolean>(false);
	return (
		<header className="mh-header">
			<div className="mh-container">
				<Link href="/" className="mh-logo" aria-label="Marham Home">
					{!logoFailed ? (
						<Image
							src={logoSrc}
							alt="Marham"
							width={140}
							height={28}
							className="mh-logo-img"
							onError={() => {
								if (logoSrc !== "/marham-logo.png") {
									setLogoSrc("/marham-logo.png");
								} else {
									setLogoFailed(true);
								}
							}}
							priority
						/>
					) : (
						<span className="mh-logo-fallback">MARHAM</span>
					)}
				</Link>
				<nav className="mh-nav" aria-label="Primary Navigation">
					<Link href="/doctors" className="mh-nav-link">Doctors</Link>
					<Link href="/video-consult" className="mh-nav-link">Video Consult</Link>
					<Link href="/labs" className="mh-nav-link">Labs</Link>
					<Link href="/pharmacy" className="mh-nav-link">Pharmacy</Link>
					<Link href="/about" className="mh-nav-link">About</Link>
				</nav>
				<div className="mh-actions">
					<Link href="/login" className="mh-btn ghost">Log in</Link>
					<Link href="/signup" className="mh-btn primary">Sign up</Link>
				</div>
			</div>
			<style jsx>{`
				.mh-header { position: sticky; top: 0; z-index: 30; background: #0b1022; border-bottom: 1px solid rgba(255,255,255,0.06); backdrop-filter: saturate(1.2) blur(6px); }
				.mh-container { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px clamp(16px, 4vw, 48px); max-width: 1200px; margin: 0 auto; }
				.mh-logo { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; }
				.mh-logo-img { display: block; height: 28px; width: auto; object-fit: contain; }
				.mh-logo-fallback { color: #0b3a53; font-weight: 800; font-size: 20px; letter-spacing: 2px; }
				.mh-nav { display: none; gap: 18px; }
				.mh-nav-link { color: #cbd5e1; text-decoration: none; font-weight: 500; transition: color .15s ease; }
				.mh-nav-link:hover { color: #ffffff; }
				.mh-actions { display: none; gap: 10px; }
				.mh-btn { padding: 8px 14px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px; }
				.mh-btn.ghost { color: #e5e7eb; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.04); }
				.mh-btn.ghost:hover { border-color: rgba(255,255,255,.2); }
				.mh-btn.primary { color: white; background: #10b981; }
				.mh-btn.primary:hover { filter: brightness(0.95); }

				@media (min-width: 900px) {
					.mh-nav { display: flex; }
					.mh-actions { display: flex; }
				}
			`}</style>
		</header>
	);
}


