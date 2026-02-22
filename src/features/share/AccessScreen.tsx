import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccessManagementSheet } from "./AccessManagementSheet";

export function AccessScreen() {
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    setSheetOpen(true);
  }, []);

  function handleSheetOpenChange(open: boolean) {
    setSheetOpen(open);
    if (!open) {
      navigate("/more");
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 -ml-1"
          onClick={() => navigate("/more")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-page-title">Sharing & Access</h1>
      </div>
      <AccessManagementSheet open={sheetOpen} onOpenChange={handleSheetOpenChange} />
    </>
  );
}
