'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Play, X } from 'lucide-react';

interface VideoModalProps {
  videoUrl: string;
  title: string;
  children?: React.ReactNode;
}

export function VideoModal({ videoUrl, title, children }: VideoModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Ver Video
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
          <video 
            src={videoUrl}
            className="w-full h-full"
            controls
            autoPlay
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
