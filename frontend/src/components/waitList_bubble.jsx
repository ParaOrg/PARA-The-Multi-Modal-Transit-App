import { useState } from 'react';
import { BubbleButton } from './waitList/BubbleButton';
import { WaitListForm } from './waitList/WaitListForm';

export default function WaitListBubble() {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => setIsOpen(!isOpen);

  return (
    <>
      {/* FORM: full-screen fixed overlay so it never gets “compressed” or lost */}
      <div
        className={`fixed inset-0 z-[60] ${
          isOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        <WaitListForm isOpen={isOpen} onClose={handleToggle} />
      </div>

      {/* BUTTON: in document flow under the ticket so it scrolls with the hero (not viewport-fixed) */}
      <div className="relative z-20 -mt-7 w-full px-4 sm:-mt-2.5">
        <div className="mx-auto flex w-full justify-center">
        <BubbleButton onClick={handleToggle} isOpen={isOpen} />
        </div>
      </div>
    </>
  );
}
