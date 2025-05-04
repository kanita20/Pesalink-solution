
import React, { useState } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import Markdown from "react-markdown"; // Assuming you're using this for markdown support

export default function AskBuddyAiDropdown({ item }: { item: any }) {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);

  const handleAskAi = async (issue: string) => {
    const response = await fetch("/api/askai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issue }),
    });
    const data = await response.json();
    setResponses((prev) => [...prev, { sender: "user", message: issue }, { sender: "ai", message: data.result }]);
  };

  return (
    <>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault();
          setSelectedIssue(item);
          setOpenDialog(true);
        }}
        className="w-full"
      >
        <Sparkles className="mr-2" />
        Ask BuddyAI
      </DropdownMenuItem>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-fit">
          <DialogHeader>
            <DialogTitle>Ask BuddyAI</DialogTitle>
            <DialogDescription>
              Let BuddyAI help in troubleshooting the system issues
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <ul>
              {responses.map((response, index) => (
                <li
                  key={index}
                  style={{
                    textAlign: response.sender === "user" ? "right" : "left",
                    background: response.sender === "user" ? "#e0f7fa" : "#f1f8e9",
                    margin: "5px 0",
                    padding: "10px",
                    borderRadius: "8px",
                    listStyle: "none",
                  }}
                >
                  <strong>{response.sender === "user" ? "You" : "BuddyAI"}:</strong>
                  <div><Markdown>{response.message}</Markdown></div>
                </li>
              ))}
            </ul>
            <Textarea
              placeholder="What can I help you with?"
              defaultValue={`What is wrong with the following account: ${JSON.stringify(selectedIssue)}`}
              minLength={5}
              onChange={(e) => setSelectedIssue((prev: any) => ({ ...prev, question: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button onClick={() => handleAskAi(selectedIssue?.question || JSON.stringify(selectedIssue))}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
