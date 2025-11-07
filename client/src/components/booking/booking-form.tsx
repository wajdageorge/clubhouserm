import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function BookingForm() {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState("2");
  const [selectedTime, setSelectedTime] = useState("8:30 AM");

  const timeSlots = [
    { time: "8:00 AM", available: true },
    { time: "8:30 AM", available: true, selected: true },
    { time: "9:00 AM", available: true },
    { time: "9:30 AM", available: true }
  ];

  return (
    <div className="border-2 border-dashed border-muted rounded-lg p-4">
      <div className="mb-4">
        <Label htmlFor="booking-date" className="block text-sm font-medium mb-2">
          Select Date
        </Label>
        <Input
          id="booking-date"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          data-testid="input-booking-date"
        />
      </div>
      
      <div className="mb-4">
        <Label htmlFor="player-count" className="block text-sm font-medium mb-2">
          Number of Players
        </Label>
        <Select value={selectedPlayers} onValueChange={setSelectedPlayers}>
          <SelectTrigger data-testid="select-player-count">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 Player</SelectItem>
            <SelectItem value="2">2 Players</SelectItem>
            <SelectItem value="3">3 Players</SelectItem>
            <SelectItem value="4">4 Players</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mb-4">
        <Label className="block text-sm font-medium mb-2">Available Times</Label>
        <div className="grid grid-cols-2 gap-2">
          {timeSlots.map((slot) => (
            <Button
              key={slot.time}
              variant={selectedTime === slot.time ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTime(slot.time)}
              disabled={!slot.available}
              data-testid={`button-time-${slot.time.replace(/[: ]/g, '-').toLowerCase()}`}
            >
              {slot.time}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="font-medium">Total Price</span>
        <span className="text-xl font-bold text-primary" data-testid="text-total-price">
          $110
        </span>
      </div>

      <Button className="w-full" data-testid="button-book-tee-time">
        Book Now
      </Button>
    </div>
  );
}
