"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { hardhat } from "viem/chains";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick, useTargetNetwork } from "~~/hooks/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Leaderboard",
    href: "/leaderboard",
  },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();

  return (
    <>
      {menuLinks.map(({ label, href, icon }) => {
        const isActive = pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              passHref
              className={`${
                isActive ? "bg-[#292929] text-white shadow-md" : "text-gray-300 "
              } hover:bg-[#2f2f2f] hover:shadow-md transition-all py-1.5 px-4 text-md rounded-full flex items-center gap-2`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </>
  );
};

/**
 * Site header
 */
export const Header = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  const burgerMenuRef = useRef<HTMLDetailsElement>(null);
  useOutsideClick(burgerMenuRef, () => {
    burgerMenuRef?.current?.removeAttribute("open");
  });

  return (
<div className="sticky top-0 navbar bg-neutral-950 backdrop-blur-xl text-white min-h-0 justify-between z-20 shadow-md px-4">
    <div className="navbar-start w-auto">
      <details className="dropdown" ref={burgerMenuRef}>
        <summary className="btn btn-ghost lg:hidden">
          <Bars3Icon className="h-5 w-5 text-white" />
        </summary>
        <ul
          className="menu dropdown-content mt-3 p-2 bg-[#1e1e1e] rounded-md shadow-md w-52"
          onClick={() => burgerMenuRef?.current?.removeAttribute("open")}
        >
          <HeaderMenuLinks />
        </ul>
      </details>

      <Link href="/" passHref className="hidden lg:flex items-center gap-2 ml-4 mr-6">
        <span className="text-2xl font-bold tracking-tight">Zapp</span>
      </Link>

      <ul className="hidden lg:flex menu menu-horizontal px-1 gap-2">
        <HeaderMenuLinks />
      </ul>
    </div>

    <div className="navbar-end gap-2">
      <RainbowKitCustomConnectButton />
      {isLocalNetwork && <FaucetButton />}
    </div>
  </div>
  );
};
