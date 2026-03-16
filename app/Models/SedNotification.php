<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SedNotification extends Model
{
    protected $table = 'sed_notifications';

    protected $fillable = [
        'user_id', 'type', 'title', 'message', 'is_read', 'related_document_id'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class, 'related_document_id');
    }
}
