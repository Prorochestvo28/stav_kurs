<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApprovalProcess;
use App\Models\ApprovalStep;
use App\Models\Document;
use Illuminate\Http\Request;

class ApprovalController extends Controller
{
    public function index()
    {
        $processes = ApprovalProcess::with(['document', 'initiator', 'steps.assignee'])->orderByDesc('created_at')->get();
        return response()->json($processes->map(fn($p) => $this->mapApproval($p)));
    }

    public function myApprovals(Request $request)
    {
        $userId = $request->user()->id;
        $processes = ApprovalProcess::with(['document', 'initiator', 'steps.assignee'])
            ->whereHas('steps', fn($q) => $q->where('assignee_id', $userId)->where('status', 'pending'))
            ->where('status', 'in_progress')
            ->orderByDesc('created_at')
            ->get();
        return response()->json($processes->map(fn($p) => $this->mapApproval($p)));
    }

    public function show(int $id)
    {
        $process = ApprovalProcess::with(['document', 'initiator', 'steps.assignee'])->find($id);
        if (!$process) {
            return response()->json(['error' => 'Согласование не найдено.', 'message' => 'Согласование не найдено.'], 404);
        }
        return response()->json($this->mapApproval($process));
    }

    public function store(Request $request)
    {
        $request->validate([
            'document_id' => 'required|exists:documents,id',
            'steps' => 'required|array|min:1',
            'steps.*.approverId' => 'required|exists:users,id',
            'deadline' => 'nullable|date',
            'comment' => 'nullable|string|max:2000',
        ]);

        $user = $request->user();
        $document = Document::findOrFail($request->document_id);
        $deadline = $request->deadline ? now()->parse($request->deadline) : now()->addDays(5);

        $process = ApprovalProcess::create([
            'document_id' => $document->id,
            'name' => 'Согласование: ' . $document->name,
            'status' => 'in_progress',
            'initiator_id' => $user->id,
            'start_date' => now(),
            'deadline' => $deadline,
            'initiator_comment' => $request->input('comment', ''),
        ]);

        foreach ($request->steps as $index => $step) {
            ApprovalStep::create([
                'process_id' => $process->id,
                'step_number' => $index + 1,
                'assignee_id' => $step['approverId'],
                'status' => $index === 0 ? 'pending' : 'waiting',
                'assigned_at' => $index === 0 ? now() : null,
            ]);
        }

        $document->update(['status' => 'review']);

        $process->load(['document', 'initiator', 'steps.assignee']);
        return response()->json($this->mapApproval($process), 201);
    }

    public function approveStep(Request $request, int $approvalId, int $stepId)
    {
        $step = ApprovalStep::where('process_id', $approvalId)->where('id', $stepId)->first();
        if (!$step || $step->assignee_id !== $request->user()->id || $step->status !== 'pending') {
            return response()->json(['error' => 'Доступ запрещён или неверный шаг согласования.', 'message' => 'Доступ запрещён или неверный шаг согласования.'], 403);
        }

        $step->update([
            'status' => 'completed',
            'decision' => 'approve',
            'comment' => $request->input('comment', ''),
            'completed_at' => now(),
        ]);

        $process = ApprovalProcess::find($approvalId);
        $nextStep = $process->steps()->where('status', 'waiting')->orderBy('step_number')->first();
        if ($nextStep) {
            $nextStep->update(['status' => 'pending', 'assigned_at' => now()]);
        } else {
            $process->update(['status' => 'completed', 'end_date' => now()]);
            $process->document->update(['status' => 'approved']);
        }

        return response()->json(['success' => true]);
    }

    public function rejectStep(Request $request, int $approvalId, int $stepId)
    {
        $step = ApprovalStep::where('process_id', $approvalId)->where('id', $stepId)->first();
        if (!$step || $step->assignee_id !== $request->user()->id || $step->status !== 'pending') {
            return response()->json(['error' => 'Доступ запрещён или неверный шаг согласования.', 'message' => 'Доступ запрещён или неверный шаг согласования.'], 403);
        }

        $step->update([
            'status' => 'completed',
            'decision' => 'reject',
            'comment' => $request->input('comment', 'Отклонено'),
            'completed_at' => now(),
        ]);

        $process = ApprovalProcess::find($approvalId);
        $process->update(['status' => 'rejected', 'end_date' => now()]);
        $process->document->update(['status' => 'rejected']);

        return response()->json(['success' => true]);
    }

    private function mapApproval(ApprovalProcess $p): array
    {
        $steps = $p->steps->map(function ($s) {
            $status = $s->status === 'completed'
                ? ($s->decision === 'approve' ? 'approved' : 'rejected')
                : ($s->status === 'pending' ? 'pending' : 'waiting');
            return [
                'id' => $s->id,
                'step_id' => $s->id,
                'step_number' => $s->step_number,
                'approverId' => $s->assignee_id,
                'approverName' => $s->assignee?->full_name ?? $s->assignee?->name ?? 'Неизвестно',
                'status' => $status,
                'assignedAt' => $s->assigned_at?->toIso8601String(),
                'approvedAt' => $s->completed_at?->toIso8601String(),
                'comment' => $s->comment ?? '',
            ];
        })->values()->all();

        return [
            'id' => $p->id,
            'process_id' => $p->id,
            'documentId' => $p->document_id,
            'documentName' => $p->document?->name ?? 'Неизвестный документ',
            'initiatorId' => $p->initiator_id,
            'initiatorName' => $p->initiator?->full_name ?? $p->initiator?->name ?? 'Неизвестно',
            'initiatorComment' => $p->initiator_comment ?? '',
            'status' => $p->status,
            'createdAt' => $p->start_date?->toIso8601String(),
            'deadline' => $p->deadline?->toIso8601String(),
            'endDate' => $p->end_date?->toIso8601String(),
            'steps' => $steps,
        ];
    }
}
