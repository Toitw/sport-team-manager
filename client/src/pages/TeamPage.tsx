
import * as React from "react";
import { useParams } from "wouter";
import { usePlayers } from "../hooks/use-players";
import { useEvents } from "../hooks/use-events";
import { useUser } from "../hooks/use-user";
import { useNews } from "../hooks/use-news";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Calendar } from "../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Layout } from "../components/Layout";
import { CreatePlayerDialog } from "../components/CreatePlayerDialog";
import { EditPlayerDialog } from "../components/EditPlayerDialog";
import { DeletePlayerDialog } from "../components/DeletePlayerDialog";
import { PlayerProfileDialog } from "../components/PlayerProfileDialog";
import { CreateEventDialog } from "../components/CreateEventDialog";
import { EditEventDialog } from "../components/EditEventDialog";
import { DeleteEventDialog } from "../components/DeleteEventDialog";
import { CreateNewsDialog } from "../components/CreateNewsDialog";
import { EditNewsDialog } from "../components/EditNewsDialog";
import { DeleteNewsDialog } from "../components/DeleteNewsDialog";
import { MatchLineupDialog } from "../components/MatchLineupDialog";
import { MatchGoalsDialog } from "../components/MatchGoalsDialog";
import { cn } from "@/lib/utils";

// Keep DayContent components as pure functions
const DayContent = React.memo(({ date, events, onEventClick }: any) => {
  const matchingEvents = events.filter(
    (event: any) =>
      format(new Date(event.startDate), "yyyy-MM-dd") === 
      format(date, "yyyy-MM-dd")
  );

  if (matchingEvents.length === 0) {
    return <div className="p-2">{date.getDate()}</div>;
  }

  return (
    <div className="relative w-full h-full z-50">
      <Popover>
        <PopoverTrigger asChild>
          <div
            className="w-full h-full p-2 cursor-pointer hover:bg-accent/50 focus:bg-accent/50 transition-colors rounded-sm"
            onClick={onEventClick}
          >
            <span>{date.getDate()}</span>
            <div className="absolute bottom-1 left-1 right-1 flex gap-0.5">
              {matchingEvents.map((event: any) => (
                <div
                  key={event.id}
                  className={cn(
                    "h-1 rounded-full flex-1",
                    event.type === "match"
                      ? "bg-red-500"
                      : event.type === "training"
                        ? "bg-green-500"
                        : "bg-blue-500"
                  )}
                />
              ))}
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-80 z-[100]"
          sideOffset={5}
          align="start"
          side="right"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-2">
            {matchingEvents.map((event: any) => (
              <div
                key={event.id}
                className="border-b last:border-0 pb-2 last:pb-0"
              >
                <div className="font-medium">{event.title}</div>
                {event.description && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {event.description}
                  </div>
                )}
                <div className="text-sm text-muted-foreground mt-1">
                  {format(new Date(event.startDate), "p")} -{" "}
                  {format(new Date(event.endDate), "p")}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Type: {event.type}
                </div>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
});

const MatchDayContent = React.memo(({ date, matches, canManageTeam }: any) => {
  const matchingEvents = matches.filter(
    (match: any) =>
      format(new Date(match.startDate), "yyyy-MM-dd") === 
      format(date, "yyyy-MM-dd")
  );

  if (matchingEvents.length === 0) {
    return <div className="p-2">{date.getDate()}</div>;
  }

  return (
    <div className="relative w-full h-full z-50">
      <Popover>
        <PopoverTrigger asChild>
          <div
            className="w-full h-full p-2 cursor-pointer hover:bg-accent/50 focus:bg-accent/50 transition-colors rounded-sm"
          >
            <span>{date.getDate()}</span>
            <div className="absolute bottom-1 left-1 right-1 flex gap-0.5">
              {matchingEvents.map((match: any) => (
                <div
                  key={match.id}
                  className="h-1 rounded-full flex-1 bg-red-500"
                />
              ))}
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-80 z-[100]"
          sideOffset={5}
          align="start"
          side="right"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-2">
            {matchingEvents.map((match: any) => (
              <div
                key={match.id}
                className="border-b last:border-0 pb-2 last:pb-0"
              >
                <div className="font-medium">{match.title}</div>
                {match.description && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {match.description}
                  </div>
                )}
                <div className="text-sm text-muted-foreground mt-1">
                  {format(new Date(match.startDate), "p")} -{" "}
                  {format(new Date(match.endDate), "p")}
                </div>
                {match.homeScore !== null && match.awayScore !== null && (
                  <div className="text-sm font-medium mt-1">
                    Score: {match.homeScore} - {match.awayScore}
                  </div>
                )}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
});

// Rest of the TeamPage component remains the same...
[The rest of the file content remains unchanged]
