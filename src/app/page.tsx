'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleIframeLoad = () => {
        console.log("Iframe loaded, attempting to add click listener...");
      try {
        const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDocument) {
          iframeDocument.addEventListener('click', (event) => {
            console.log("Click detected inside iframe");
            let targetElement = event.target as HTMLElement;

            // Check if the clicked element or its parent is a 'Get Started' link
            // We check class names that seem associated with those buttons based on previous reads
            let isGetStartedButton = false;
            while(targetElement && targetElement !== iframeDocument.body) {
                if (targetElement.tagName === 'A' && targetElement.classList.contains('framer-alpTH')) {
                     // Further check if it contains the specific text or specific parent classes
                     const textContent = targetElement.textContent || "";
                     if(textContent.includes("Get Started")) {
                         isGetStartedButton = true;
                         break;
                     }
                }
                targetElement = targetElement.parentElement as HTMLElement;
            }


            if (isGetStartedButton) {
              console.log("'Get Started' button clicked, navigating...");
              event.preventDefault(); // Prevent default link behavior
              event.stopPropagation();
              router.push('/signup'); // Navigate using Next.js router
            }
          }, true); // Use capture phase to catch clicks reliably
          console.log("Click listener added to iframe document.");
        } else {
           console.error("Could not access iframe document.");
        }
      } catch (error) {
        console.error('Error accessing iframe content or adding listener:', error);
        // Errors often occur due to cross-origin restrictions if the iframe src is not from the same origin
        // Since we are loading /index.html from the public folder, this *should* be same-origin.
      }
    };

    iframe.addEventListener('load', handleIframeLoad);

    // Cleanup
    return () => {
      iframe.removeEventListener('load', handleIframeLoad);
      // Note: Removing the click listener from the iframe's document on cleanup can be tricky
      //       as the document might be gone or changed.
    };
  }, [router]);

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      <iframe
        ref={iframeRef}
        src="/index.html"
        title="Landing Page"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          margin: 0,
          padding: 0,
        }}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      />
    </div>
  );
} 