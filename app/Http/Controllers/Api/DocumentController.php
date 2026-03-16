<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Document;
use App\Models\DocumentVersion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    private const FILE_MAX_SIZE_MB = 1024; // 1 ГБ
    private const STORAGE_DIR = 'documents';
    public function index(Request $request)
    {
        $query = Document::with(['author', 'category', 'type', 'versions']);

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }
        if ($request->has('category') && $request->category !== 'all') {
            $query->whereHas('category', fn($q) => $q->where('name', $request->category));
        }
        if ($request->has('search') && $request->search) {
            $q = $request->search;
            $query->where(function ($qry) use ($q) {
                $qry->where('name', 'like', "%{$q}%")
                    ->orWhereHas('versions', fn($v) => $v->where('change_comment', 'like', "%{$q}%"))
                    ->orWhereHas('author', fn($a) => $a->where('full_name', 'like', "%{$q}%"));
            });
        }
        if ($request->filled('startDate')) {
            $query->where('updated_at', '>=', $request->startDate);
        }
        if ($request->filled('endDate')) {
            $end = $request->endDate;
            if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $end)) {
                $end = $end . ' 23:59:59';
            }
            $query->where('updated_at', '<=', $end);
        }

        $documents = $query->orderByDesc('updated_at')->get();
        return response()->json($documents->map(fn($d) => $this->mapDocument($d)));
    }

    public function show(int $id)
    {
        $doc = Document::with(['author', 'category', 'type', 'versions'])->find($id);
        if (!$doc) {
            return response()->json(['error' => 'Документ не найден.', 'message' => 'Документ не найден.'], 404);
        }
        return response()->json($this->mapDocument($doc));
    }

    public function store(Request $request)
    {
        $rules = [
            'name' => 'required|string|max:255',
            'category' => 'nullable|string',
            'description' => 'nullable|string',
            'file' => 'nullable|file|max:' . (self::FILE_MAX_SIZE_MB * 1024),
        ];
        $request->validate($rules);

        $user = $request->user();
        $category = null;
        if ($request->category) {
            $category = Category::firstOrCreate(
                ['name' => $request->category],
                ['path' => $request->category]
            );
        }

        $typeId = \App\Models\DocumentType::first()?->id;

        $doc = Document::create([
            'name' => $request->name,
            'type_id' => $typeId,
            'category_id' => $category?->id,
            'status' => 'draft',
            'author_id' => $user->id,
        ]);

        $filePath = null;
        $fileName = '';
        $fileSize = 0;
        if ($request->hasFile('file')) {
            $uploaded = $request->file('file');
            $fileName = $uploaded->getClientOriginalName();
            $filePath = $uploaded->store(self::STORAGE_DIR . '/' . $doc->id, 'local');
            $fileSize = $uploaded->getSize();
        } elseif ($request->filled('fileUrl')) {
            $fileName = $request->fileUrl;
            $filePath = $request->fileUrl;
        }

        DocumentVersion::create([
            'document_id' => $doc->id,
            'version_number' => 1,
            'file_name' => $fileName,
            'file_url' => $filePath ?? '',
            'file_size' => $fileSize,
            'change_comment' => $request->description ?? 'Первоначальная версия',
            'author_id' => $user->id,
            'created_at' => now(),
        ]);

        $doc->load(['author', 'category', 'type', 'versions']);
        return response()->json($this->mapDocument($doc), 201);
    }

    public function update(Request $request, int $id)
    {
        $doc = Document::find($id);
        if (!$doc) {
            return response()->json(['error' => 'Документ не найден.', 'message' => 'Документ не найден.'], 404);
        }

        $rules = [
            'name' => 'sometimes|string|max:255',
            'category' => 'nullable|string',
            'status' => 'sometimes|in:draft,review,approved,rejected',
            'description' => 'nullable|string',
            'file' => 'nullable|file|max:' . (self::FILE_MAX_SIZE_MB * 1024),
        ];
        $request->validate($rules);

        if ($request->has('category')) {
            $category = $request->category
                ? Category::firstOrCreate(
                    ['name' => $request->category],
                    ['path' => $request->category]
                )
                : null;
            $doc->category_id = $category?->id;
        }
        if ($request->has('name')) {
            $doc->name = $request->name;
        }
        if ($request->has('status')) {
            $doc->status = $request->status;
        }
        $doc->save();

        $newVersion = $request->hasFile('file') || $request->filled('description') || $request->filled('fileUrl');
        if ($newVersion) {
            $last = $doc->versions()->first();
            $nextNum = $last ? $last->version_number + 1 : 1;
            $filePath = $last?->file_url;
            $fileName = $last?->file_name ?? '';
            $fileSize = $last?->file_size ?? 0;

            if ($request->hasFile('file')) {
                $uploaded = $request->file('file');
                $fileName = $uploaded->getClientOriginalName();
                $filePath = $uploaded->store(self::STORAGE_DIR . '/' . $doc->id, 'local');
                $fileSize = $uploaded->getSize();
            } elseif ($request->filled('fileUrl')) {
                $fileName = $request->fileUrl;
                $filePath = $request->fileUrl;
                $fileSize = 0;
            }

            DocumentVersion::create([
                'document_id' => $doc->id,
                'version_number' => $nextNum,
                'file_name' => $fileName,
                'file_url' => $filePath ?? '',
                'file_size' => $fileSize,
                'change_comment' => $request->description ?? 'Обновление документа',
                'author_id' => $request->user()->id,
                'created_at' => now(),
            ]);
        }

        $doc->load(['author', 'category', 'type', 'versions']);
        return response()->json($this->mapDocument($doc));
    }

    public function destroy(int $id)
    {
        $doc = Document::find($id);
        if (!$doc) {
            return response()->json(['error' => 'Документ не найден.', 'message' => 'Документ не найден.'], 404);
        }
        Storage::disk('local')->deleteDirectory(self::STORAGE_DIR . '/' . $id);
        $doc->delete();
        return response()->json(null, 204);
    }

    public function download(int $id)
    {
        $doc = Document::with('versions')->find($id);
        if (!$doc) {
            return response()->json(['error' => 'Документ не найден.', 'message' => 'Документ не найден.'], 404);
        }
        $version = $doc->versions->first();
        if (!$version || !$version->file_url || !Storage::disk('local')->exists($version->file_url)) {
            return response()->json(['error' => 'Файл не найден.', 'message' => 'К документу не прикреплён файл.'], 404);
        }
        $name = $version->file_name ?: basename($version->file_url);
        return Storage::disk('local')->download($version->file_url, $name);
    }

    public function versions(int $id)
    {
        $doc = Document::with(['versions.author'])->find($id);
        if (!$doc) {
            return response()->json(['error' => 'Документ не найден.', 'message' => 'Документ не найден.'], 404);
        }
        $list = $doc->versions->map(function ($v) {
            return [
                'id' => $v->id,
                'version_number' => $v->version_number,
                'file_name' => $v->file_name ?? '',
                'file_size' => $v->file_size ?? 0,
                'change_comment' => $v->change_comment ?? '',
                'author' => $v->author?->full_name ?? $v->author?->name ?? 'Неизвестно',
                'author_id' => $v->author_id,
                'created_at' => $v->created_at?->toIso8601String(),
            ];
        })->values()->all();
        return response()->json($list);
    }

    public function downloadVersion(int $id, int $versionId)
    {
        $doc = Document::find($id);
        if (!$doc) {
            return response()->json(['error' => 'Документ не найден.', 'message' => 'Документ не найден.'], 404);
        }
        $version = DocumentVersion::where('document_id', $id)->where('id', $versionId)->first();
        if (!$version) {
            return response()->json(['error' => 'Версия не найдена.', 'message' => 'Версия не найдена.'], 404);
        }
        if (!$version->file_url || !Storage::disk('local')->exists($version->file_url)) {
            return response()->json(['error' => 'Файл не найден.', 'message' => 'Файл этой версии отсутствует.'], 404);
        }
        $name = $version->file_name ?: basename($version->file_url);
        return Storage::disk('local')->download($version->file_url, $name);
    }

    public function stats(Request $request)
    {
        $query = Document::query();
        if ($request->startDate) {
            $query->where('updated_at', '>=', $request->startDate);
        }
        if ($request->endDate) {
            $end = $request->endDate;
            if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $end)) {
                $end = $end . ' 23:59:59';
            }
            $query->where('updated_at', '<=', $end);
        }
        $documents = $query->with('category')->get();

        $categories = Category::all()->pluck('name')->flip()->map(fn() => 0)->all();
        foreach ($documents as $doc) {
            if ($doc->category?->name) {
                $categories[$doc->category->name] = ($categories[$doc->category->name] ?? 0) + 1;
            }
        }

        $byStatus = [
            'draft' => $documents->where('status', 'draft')->count(),
            'review' => $documents->where('status', 'review')->count(),
            'approved' => $documents->where('status', 'approved')->count(),
            'rejected' => $documents->where('status', 'rejected')->count(),
        ];

        return response()->json([
            'total' => $documents->count(),
            'byStatus' => $byStatus,
            'byCategory' => $categories,
        ]);
    }

    private function mapDocument(Document $doc): array
    {
        $latest = $doc->versions->first();
        return [
            'id' => $doc->id,
            'document_id' => $doc->id,
            'name' => $doc->name ?? 'Без названия',
            'author' => $doc->author?->full_name ?? $doc->author?->name ?? 'Неизвестно',
            'authorId' => $doc->author_id,
            'status' => $doc->status ?? 'draft',
            'category' => $doc->category?->name ?? 'Без категории',
            'category_id' => $doc->category_id,
            'type_id' => $doc->type_id,
            'type' => $doc->type?->name ?? '',
            'createdAt' => $doc->created_at?->toIso8601String(),
            'updatedAt' => $doc->updated_at?->toIso8601String(),
            'description' => $latest?->change_comment ?? '',
            'fileUrl' => $latest?->file_url ?? '',
            'fileName' => $latest?->file_name ?? '',
            'fileSize' => $latest?->file_size ?? 0,
            'version' => $latest?->version_number ?? 1,
        ];
    }
}
