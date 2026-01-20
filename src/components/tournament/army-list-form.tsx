'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  parseInfinityArmyCode,
  validateInfinityList,
  INFINITY_FACTIONS,
} from '@infinity-tournament/shared/games';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface ArmyListFormProps {
  tournamentId: string;
  registrationId: string;
  existingCode: string | null;
  existingFaction: string | null;
  isPastDeadline: boolean;
  pointLimit: number;
}

export function ArmyListForm({
  tournamentId,
  registrationId,
  existingCode,
  existingFaction,
  isPastDeadline,
  pointLimit,
}: ArmyListFormProps) {
  const router = useRouter();
  const [code, setCode] = useState(existingCode || '');
  const [faction, setFaction] = useState<string>(existingFaction || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCodeChange = (value: string) => {
    setCode(value);

    // Auto-detect faction from code
    if (value.length > 20) {
      const parsed = parseInfinityArmyCode(value);
      if (parsed.faction && !faction) {
        setFaction(parsed.faction);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Parse and validate using shared package
    const parsed = parseInfinityArmyCode(code);
    const validation = validateInfinityList(parsed, { pointLimit });

    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return;
    }

    if (!faction) {
      setError('Please select a faction');
      return;
    }

    setIsLoading(true);

    const supabase = createClient();

    const { error: updateError } = await supabase
      .from('registrations')
      .update({
        army_list_code: code,
        army_faction: faction,
      })
      .eq('id', registrationId);

    setIsLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    toast.success('Army list submitted!');
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {existingCode ? 'Update Army List' : 'Submit Army List'}
        </CardTitle>
        <CardDescription>
          Paste your army code from the Infinity Army builder
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="faction">Faction</Label>
            <Select
              value={faction}
              onValueChange={(v) => setFaction(v)}
              disabled={isPastDeadline}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select faction" />
              </SelectTrigger>
              <SelectContent>
                {INFINITY_FACTIONS.map((f) => (
                  <SelectItem key={f.id} value={f.name}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Army Code</Label>
            <Textarea
              id="code"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder={`Paste your army code here...

Example:
FACTION: PanOceania
POINTS: 300/300
...`}
              rows={15}
              className="font-mono text-sm"
              disabled={isPastDeadline}
            />
            <p className="text-xs text-muted-foreground">
              Export your army from the Infinity Army builder and paste the full
              code here
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || isPastDeadline}>
            {isLoading
              ? 'Saving...'
              : existingCode
                ? 'Update List'
                : 'Submit List'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
