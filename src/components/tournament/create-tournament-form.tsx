'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import {
  createTournamentSchema,
  type CreateTournamentInput,
} from '@/lib/validations/tournament';
import { POINT_LIMITS } from '@/types';
import { gameRegistry } from '@infinity-tournament/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { CsrfInput } from '@/components/ui/csrf-input';

export function CreateTournamentForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<CreateTournamentInput>({
    resolver: zodResolver(createTournamentSchema) as any,
    defaultValues: {
      game_system_id: 'infinity',
      point_limit: 300,
      rounds: 3,
      time_limit: 90,
    },
  });

  const pointLimit = watch('point_limit');

  const nextStep = async () => {
    let fieldsToValidate: (keyof CreateTournamentInput)[] = [];

    if (step === 1) {
      fieldsToValidate = ['name', 'date_start', 'location'];
    } else if (step === 2) {
      fieldsToValidate = ['game_system_id', 'point_limit', 'rounds', 'time_limit'];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    setStep((s) => s - 1);
  };

  const onSubmit = async (data: CreateTournamentInput) => {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError('You must be logged in');
      setIsLoading(false);
      return;
    }

    const { data: tournament, error: insertError } = await supabase
      .from('tournaments')
      .insert({
        ...data,
        organizer_id: user.id,
        status: 'draft',
        max_capacity: data.max_capacity || null,
        registration_deadline: data.registration_deadline || null,
        list_deadline: data.list_deadline || null,
      })
      .select()
      .single();

    setIsLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    toast.success('Tournament created!');
    router.push(`/to/${tournament.id}`);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Tournament</CardTitle>
        <CardDescription>
          Step {step} of 3:{' '}
          {step === 1
            ? 'Basic Information'
            : step === 2
              ? 'Format Settings'
              : 'Registration Options'}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <CsrfInput />
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Tournament Name</Label>
                <Input
                  id="name"
                  placeholder="Winter Offensive 2026"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Tell players about your event..."
                  rows={3}
                  {...register('description')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_start">Start Date</Label>
                  <Input id="date_start" type="date" {...register('date_start')} />
                  {errors.date_start && (
                    <p className="text-sm text-destructive">
                      {errors.date_start.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_end">End Date (optional)</Label>
                  <Input id="date_end" type="date" {...register('date_end')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Game Store, City, State"
                  {...register('location')}
                />
                {errors.location && (
                  <p className="text-sm text-destructive">
                    {errors.location.message}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Step 2: Format */}
          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="game_system_id">Game System</Label>
                <Select
                  value={watch('game_system_id')}
                  onValueChange={(v) =>
                    setValue('game_system_id', v, { shouldValidate: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {gameRegistry.getAll().map((game) => (
                      <SelectItem key={game.id} value={game.id}>
                        {game.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.game_system_id && (
                  <p className="text-sm text-destructive">
                    {errors.game_system_id.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="point_limit">Point Limit</Label>
                <Select
                  value={String(pointLimit)}
                  onValueChange={(v) =>
                    setValue('point_limit', parseInt(v), { shouldValidate: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POINT_LIMITS.map((pts) => (
                      <SelectItem key={pts} value={String(pts)}>
                        {pts} points
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.point_limit && (
                  <p className="text-sm text-destructive">
                    {errors.point_limit.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rounds">Number of Rounds</Label>
                <Select
                  value={String(watch('rounds'))}
                  onValueChange={(v) =>
                    setValue('rounds', parseInt(v), { shouldValidate: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 4, 5, 6].map((r) => (
                      <SelectItem key={r} value={String(r)}>
                        {r} rounds
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time_limit">Round Time (minutes)</Label>
                <Select
                  value={String(watch('time_limit'))}
                  onValueChange={(v) =>
                    setValue('time_limit', parseInt(v), { shouldValidate: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[60, 75, 90, 105, 120, 150, 180].map((t) => (
                      <SelectItem key={t} value={String(t)}>
                        {t} minutes
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Step 3: Registration */}
          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="max_capacity">
                  Maximum Capacity (leave empty for unlimited)
                </Label>
                <Input
                  id="max_capacity"
                  type="number"
                  min={4}
                  max={128}
                  placeholder="32"
                  {...register('max_capacity')}
                />
                {errors.max_capacity && (
                  <p className="text-sm text-destructive">
                    {errors.max_capacity.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="registration_deadline">
                  Registration Deadline (optional)
                </Label>
                <Input
                  id="registration_deadline"
                  type="datetime-local"
                  {...register('registration_deadline')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="list_deadline">
                  Army List Deadline (optional)
                </Label>
                <Input
                  id="list_deadline"
                  type="datetime-local"
                  {...register('list_deadline')}
                />
              </div>
            </>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          {step > 1 ? (
            <Button type="button" variant="outline" onClick={prevStep}>
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button type="button" onClick={nextStep}>
              Next
            </Button>
          ) : (
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Tournament'}
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
