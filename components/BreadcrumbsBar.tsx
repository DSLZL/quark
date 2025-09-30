"use client";
import { Breadcrumbs, BreadcrumbItem, Button } from '@heroui/react';
import React from 'react';
import { BreadcrumbItemType } from '@/types/file';

interface Props {
  breadcrumbs: BreadcrumbItemType[];
  onClick: (crumb: BreadcrumbItemType, index: number) => void;
  canGoBack: boolean;
  onBack: () => void;
}

export default function BreadcrumbsBar({ breadcrumbs, onClick, canGoBack, onBack }: Props) {
  return (
    <div className="flex-grow flex items-center text-xl font-semibold gap-2">
      {canGoBack && (
        <Button isIconOnly variant="light" onClick={onBack} aria-label="返回上级">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </Button>
      )}
      <Breadcrumbs size="sm" variant="solid">
        {breadcrumbs.map((crumb, index) => (
          <BreadcrumbItem key={crumb.fid}>
            {index < breadcrumbs.length - 1 ? (
              <a href="#" onClick={(e) => { e.preventDefault(); onClick(crumb, index); }} className="text-primary hover:underline">
                {crumb.name}
              </a>
            ) : (
              <span className="font-medium">{crumb.name}</span>
            )}
          </BreadcrumbItem>
        ))}
      </Breadcrumbs>
    </div>
  );
}

