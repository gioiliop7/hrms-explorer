import { ExtendedOrganization } from "@/types/frontend";
import { Check, Share2 } from "lucide-react";
import { useState } from "react";

export default function ShareButton({
  organization,
}: {
  organization: ExtendedOrganization;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    let url = window.location.href;
    const urlObj = new URL(url);
    const params = Object.fromEntries(urlObj.searchParams.entries());
  
    if (!params.org || params.org !== organization.code) {
      urlObj.pathname = "/"; 
      urlObj.searchParams.set("org", organization.code);
      url = urlObj.toString();
    }
  
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className={`
          flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200
          ${
            copied
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-teal-100 text-teal-700 hover:bg-teal-200"
          }
        `}
      title="Αντιγραφή συνδέσμου φορέα"
    >
      {copied ? (
        <>
          <Check className="h-5 w-5" />
          <span className="hidden sm:inline font-medium">Αντιγράφηκε!</span>
        </>
      ) : (
        <>
          <Share2 className="h-5 w-5" />
          <span className="hidden sm:inline">Κοινοποίηση</span>
        </>
      )}
    </button>
  );
}
