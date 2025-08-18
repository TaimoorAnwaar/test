"use client";
import Link from "next/link";
import Image from "next/image";
import React, { useState } from "react";

export default function SiteFooter() {
	const [logoSrc, setLogoSrc] = useState<string>("/marham-logo.svg");
	const [logoFailed, setLogoFailed] = useState<boolean>(false);
	return (
		<footer className="mh-footer">
			<div className="mh-container">
				<Link href="/" className="mh-brand" aria-label="Marham Home">
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
					<div className="mh-copy">
						<div className="mh-desc">Pakistan's most trusted healthcare platform.</div>
					</div>
				</Link>
				<nav className="mh-links">
					<Link href=''>Privacy</Link>
					<Link href="">Terms</Link>
					<Link href="">Contact</Link>
				</nav>
			</div>
			<div className="mh-bottom">© {new Date().getFullYear()} Marham. All rights reserved.</div>
			<style jsx>{`
				.mh-footer { background: #0b1022; border-top: 1px solid rgba(255,255,255,0.08); color: #94a3b8; }
				.mh-container { max-width: 1200px; margin: 0 auto; padding: 24px clamp(16px, 4vw, 48px); display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; }
				.mh-brand { display: flex; align-items: center; gap: 12px; text-decoration: none; }
				.mh-logo-img { display: block; height: 28px; width: auto; object-fit: contain; }
				.mh-logo-fallback { color: #0b3a53; font-weight: 800; font-size: 20px; letter-spacing: 2px; }
				.mh-title { color: #e5e7eb; font-weight: 700; }
				.mh-desc { font-size: 12px; opacity: .9; }
				.mh-links { display: flex; gap: 16px; }
				.mh-links a { color: #cbd5e1; text-decoration: none; }
				.mh-links a:hover { color: #ffffff; }
				.mh-bottom { text-align: center; padding: 12px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 12px; }
			`}</style>
		</footer>
	);
}


