<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ApprovalProcess extends Model
{
    protected $fillable = [
        'document_id', 'name', 'status', 'initiator_id',
        'start_date', 'end_date', 'deadline', 'initiator_comment'
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'datetime',
            'end_date' => 'datetime',
            'deadline' => 'datetime',
        ];
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class, 'document_id');
    }

    public function initiator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'initiator_id');
    }

    public function steps(): HasMany
    {
        return $this->hasMany(ApprovalStep::class, 'process_id')->orderBy('step_number');
    }
}
