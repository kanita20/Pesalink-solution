
import React from 'react';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  return (
    <div className="border-b bg-white">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-xl font-bold text-pesalink-primary">
            PesaLink Batch Buddy
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">Finance Department</span>
          <Button size="sm" variant="outline">Help</Button>
          <div className="h-8 w-8 rounded-full bg-pesalink-primary flex items-center justify-center text-white font-medium">
            FM
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
