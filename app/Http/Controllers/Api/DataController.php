<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApprovalProcess;
use App\Models\ApprovalStep;
use App\Models\Category;
use App\Models\Department;
use App\Models\Document;
use App\Models\DocumentType;
use App\Models\DocumentVersion;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class DataController extends Controller
{
    public function user(Request $request)
    {
        $user = $request->user();
        $user->load('department');
        $roleMap = ['admin' => 'Администратор', 'editor' => 'Редактор', 'user' => 'Пользователь'];
        return response()->json([
            'id' => $user->id,
            'user_id' => $user->id,
            'email' => $user->email,
            'fullName' => $user->full_name ?? $user->name,
            'name' => $user->full_name ?? $user->name,
            'role' => $roleMap[$user->role] ?? $user->role,
            'position' => $user->position ?? '',
            'phone' => $user->phone ?? '',
            'department' => $user->department?->name ?? '',
            'department_id' => $user->department_id,
            'is_active' => $user->is_active,
        ]);
    }

    public function departments()
    {
        $items = Department::orderBy('name')->get();
        return response()->json($items->map(fn($d) => [
            'department_id' => $d->id,
            'name' => $d->name,
            'description' => $d->description,
        ]));
    }

    public function storeDepartment(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['error' => 'Доступ запрещён.', 'message' => 'Доступ запрещён.'], 403);
        }
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);
        $dept = Department::create([
            'name' => $request->name,
            'description' => $request->description ?? '',
        ]);
        return response()->json([
            'department_id' => $dept->id,
            'name' => $dept->name,
            'description' => $dept->description,
        ], 201);
    }

    public function destroyDepartment(Request $request, int $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['error' => 'Доступ запрещён.', 'message' => 'Доступ запрещён.'], 403);
        }
        $dept = Department::find($id);
        if (!$dept) {
            return response()->json(['error' => 'Отдел не найден.', 'message' => 'Отдел не найден.'], 404);
        }
        \App\Models\User::where('department_id', $id)->update(['department_id' => null]);
        $dept->delete();
        return response()->json(null, 204);
    }

    public function documentTypes()
    {
        $items = DocumentType::orderBy('name')->get();
        return response()->json($items->map(fn($t) => [
            'type_id' => $t->id,
            'name' => $t->name,
            'code' => $t->code,
            'description' => $t->description,
        ]));
    }

    public function updateDepartment(Request $request, int $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['error' => 'Доступ запрещён.', 'message' => 'Доступ запрещён.'], 403);
        }
        $dept = Department::find($id);
        if (!$dept) {
            return response()->json(['error' => 'Отдел не найден.', 'message' => 'Отдел не найден.'], 404);
        }
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);
        $dept->name = $request->name;
        $dept->description = $request->description ?? $dept->description;
        $dept->save();
        return response()->json([
            'department_id' => $dept->id,
            'name' => $dept->name,
            'description' => $dept->description,
        ]);
    }

    public function categories()
    {
        $items = Category::orderBy('name')->get();
        return response()->json($items->map(fn($c) => [
            'category_id' => $c->id,
            'name' => $c->name,
            'parent_id' => $c->parent_id,
            'path' => $c->path,
        ]));
    }

    public function updateCategory(Request $request, int $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['error' => 'Доступ запрещён.', 'message' => 'Доступ запрещён.'], 403);
        }
        $category = Category::find($id);
        if (!$category) {
            return response()->json(['error' => 'Категория не найдена.', 'message' => 'Категория не найдена.'], 404);
        }
        $request->validate([
            'name' => 'required|string|max:255',
            'path' => 'nullable|string|max:500',
        ]);
        $category->name = $request->name;
        $category->path = $request->filled('path') ? $request->path : $request->name;
        $category->save();
        return response()->json([
            'category_id' => $category->id,
            'name' => $category->name,
            'parent_id' => $category->parent_id,
            'path' => $category->path,
        ]);
    }

    public function storeCategory(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['error' => 'Доступ запрещён.', 'message' => 'Доступ запрещён.'], 403);
        }
        $request->validate([
            'name' => 'required|string|max:255',
            'path' => 'nullable|string|max:500',
        ]);
        $name = $request->name;
        $category = Category::create([
            'name' => $name,
            'path' => $request->filled('path') ? $request->path : $name,
            'parent_id' => null,
        ]);
        return response()->json([
            'category_id' => $category->id,
            'name' => $category->name,
            'parent_id' => $category->parent_id,
            'path' => $category->path,
        ], 201);
    }

    public function destroyCategory(Request $request, int $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['error' => 'Доступ запрещён.', 'message' => 'Доступ запрещён.'], 403);
        }
        $category = Category::find($id);
        if (!$category) {
            return response()->json(['error' => 'Категория не найдена.', 'message' => 'Категория не найдена.'], 404);
        }
        \App\Models\Document::where('category_id', $id)->update(['category_id' => null]);
        $category->delete();
        return response()->json(null, 204);
    }

    public function users(Request $request)
    {
        $query = User::with('department')->orderBy('full_name');

        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($qb) use ($q) {
                $qb->where('full_name', 'like', '%' . $q . '%')
                    ->orWhere('email', 'like', '%' . $q . '%')
                    ->orWhere('position', 'like', '%' . $q . '%')
                    ->orWhere('phone', 'like', '%' . $q . '%')
                    ->orWhereHas('department', fn($d) => $d->where('name', 'like', '%' . $q . '%'));
            });
        }

        if ($request->filled('role')) {
            $role = $request->role;
            if (in_array($role, ['admin', 'editor', 'user'], true)) {
                $query->where('role', $role);
            }
        }

        if ($request->filled('department_id')) {
            $query->where('department_id', (int) $request->department_id);
        }

        $roleMap = ['admin' => 'Администратор', 'editor' => 'Редактор', 'user' => 'Пользователь'];
        $mapUser = fn($u) => [
            'user_id' => $u->id,
            'id' => $u->id,
            'email' => $u->email,
            'fullName' => $u->full_name ?? $u->name,
            'name' => $u->full_name ?? $u->name,
            'role' => $roleMap[$u->role] ?? $u->role,
            'position' => $u->position ?? '',
            'phone' => $u->phone ?? '',
            'department' => $u->department?->name ?? '',
            'department_id' => $u->department_id,
            'is_active' => $u->is_active,
        ];

        // Без параметров пагинации/фильтров — возвращаем весь список (для согласований и т.д.)
        if (!$request->has('page') && !$request->filled('search') && !$request->filled('role') && !$request->filled('department_id')) {
            return response()->json($query->get()->map($mapUser)->values()->all());
        }

        $perPage = (int) $request->get('per_page', 10);
        $perPage = $perPage >= 1 && $perPage <= 100 ? $perPage : 10;
        $paginator = $query->paginate($perPage);
        $items = $paginator->getCollection()->map($mapUser)->values()->all();

        return response()->json([
            'data' => $items,
            'total' => $paginator->total(),
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
        ]);
    }

    public function activity(Request $request)
    {
        $userId = $request->user()->id;
        $items = [];

        foreach (Document::where('author_id', $userId)->orderByDesc('created_at')->limit(30)->get() as $doc) {
            $items[] = [
                'type' => 'document_created',
                'title' => 'Создан документ «' . ($doc->name ?? 'Без названия') . '»',
                'date' => $doc->created_at?->toIso8601String(),
                'url' => '/documents/' . $doc->id,
            ];
        }

        foreach (DocumentVersion::with('document')
            ->where('author_id', $userId)
            ->where('version_number', '>', 1)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get() as $ver) {
            $items[] = [
                'type' => 'document_updated',
                'title' => 'Изменена версия документа «' . ($ver->document?->name ?? 'Без названия') . '»',
                'date' => $ver->created_at?->toIso8601String(),
                'url' => '/documents/' . $ver->document_id,
            ];
        }

        foreach (ApprovalProcess::with('document')
            ->where('initiator_id', $userId)
            ->orderByDesc('start_date')
            ->limit(30)
            ->get() as $proc) {
            $items[] = [
                'type' => 'approval_started',
                'title' => 'Отправлено на согласование: «' . ($proc->document?->name ?? 'Документ') . '»',
                'date' => $proc->start_date?->toIso8601String(),
                'url' => '/approvals/' . $proc->id,
            ];
        }

        foreach (ApprovalStep::with('process.document')
            ->where('assignee_id', $userId)
            ->where('status', 'completed')
            ->orderByDesc('completed_at')
            ->limit(50)
            ->get() as $step) {
            $docName = $step->process?->document?->name ?? 'Документ';
            $items[] = [
                'type' => $step->decision === 'approve' ? 'approval_approved' : 'approval_rejected',
                'title' => ($step->decision === 'approve' ? 'Согласован' : 'Отклонён') . ' документ «' . $docName . '»',
                'date' => $step->completed_at?->toIso8601String(),
                'url' => '/approvals/' . $step->process_id,
            ];
        }

        usort($items, fn ($a, $b) => strcmp($b['date'] ?? '', $a['date'] ?? ''));
        $items = array_slice($items, 0, 50);

        return response()->json($items);
    }

    public function updateUser(Request $request)
    {
        $user = $request->user();
        $request->validate([
            'fullName' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:50',
            'position' => 'nullable|string|max:255',
            'department_id' => 'nullable|exists:departments,id',
        ]);
        if ($request->has('fullName')) {
            $user->full_name = $request->fullName;
            $user->name = $request->fullName;
        }
        if ($request->has('email')) {
            $user->email = $request->email;
        }
        if ($request->has('phone')) {
            $user->phone = $request->phone;
        }
        if ($request->has('position')) {
            $user->position = $request->position;
        }
        if ($request->has('department_id')) {
            $user->department_id = $request->department_id;
        }
        $user->save();
        $user->load('department');
        $roleMap = ['admin' => 'Администратор', 'editor' => 'Редактор', 'user' => 'Пользователь'];
        return response()->json([
            'id' => $user->id,
            'user_id' => $user->id,
            'email' => $user->email,
            'fullName' => $user->full_name ?? $user->name,
            'name' => $user->full_name ?? $user->name,
            'role' => $roleMap[$user->role] ?? $user->role,
            'position' => $user->position ?? '',
            'phone' => $user->phone ?? '',
            'department' => $user->department?->name ?? '',
            'department_id' => $user->department_id,
            'is_active' => $user->is_active,
        ]);
    }

    public function storeUser(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['error' => 'Доступ запрещён.', 'message' => 'Доступ запрещён.'], 403);
        }
        $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|max:50',
            'password' => 'required|string|min:6',
            'position' => 'nullable|string|max:255',
            'department_id' => 'nullable|exists:departments,id',
            'role' => 'required|in:admin,editor,user',
            'is_active' => 'boolean',
        ]);
        $user = User::create([
            'name' => $request->full_name,
            'full_name' => $request->full_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone,
            'position' => $request->position,
            'department_id' => $request->department_id ?: null,
            'role' => $request->role,
            'is_active' => $request->boolean('is_active', true),
        ]);
        $user->load('department');
        $roleMap = ['admin' => 'Администратор', 'editor' => 'Редактор', 'user' => 'Пользователь'];
        return response()->json([
            'user_id' => $user->id,
            'id' => $user->id,
            'email' => $user->email,
            'fullName' => $user->full_name,
            'name' => $user->full_name,
            'role' => $roleMap[$user->role] ?? $user->role,
            'position' => $user->position ?? '',
            'phone' => $user->phone ?? '',
            'department' => $user->department?->name ?? '',
            'department_id' => $user->department_id,
            'is_active' => $user->is_active,
        ], 201);
    }

    public function updateUserById(Request $request, int $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['error' => 'Доступ запрещён.', 'message' => 'Доступ запрещён.'], 403);
        }
        $user = User::findOrFail($id);
        $request->validate([
            'full_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'phone' => 'nullable|string|max:50',
            'password' => 'nullable|string|min:6',
            'position' => 'nullable|string|max:255',
            'department_id' => 'nullable|exists:departments,id',
            'role' => 'sometimes|in:admin,editor,user',
            'is_active' => 'boolean',
        ]);
        if ($request->has('full_name')) {
            $user->full_name = $request->full_name;
            $user->name = $request->full_name;
        }
        if ($request->has('email')) {
            $user->email = $request->email;
        }
        if ($request->has('phone')) {
            $user->phone = $request->phone;
        }
        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }
        if ($request->has('position')) {
            $user->position = $request->position;
        }
        if (array_key_exists('department_id', $request->all())) {
            $user->department_id = $request->department_id ?: null;
        }
        if ($request->has('role')) {
            if ($user->role === 'admin' && $request->role !== 'admin') {
                $adminsCount = User::where('role', 'admin')->where('id', '!=', $id)->count();
                if ($adminsCount < 1) {
                    return response()->json([
                        'error' => 'В системе должен остаться хотя бы один администратор.',
                        'message' => 'В системе должен остаться хотя бы один администратор.',
                    ], 422);
                }
            }
            $user->role = $request->role;
        }
        if (array_key_exists('is_active', $request->all())) {
            $newActive = $request->boolean('is_active');
            if ($user->role === 'admin' && !$newActive) {
                $otherActiveAdmins = User::where('role', 'admin')->where('id', '!=', $id)->where('is_active', true)->count();
                if ($otherActiveAdmins < 1) {
                    return response()->json([
                        'error' => 'В системе должен остаться хотя бы один активный администратор.',
                        'message' => 'В системе должен остаться хотя бы один активный администратор.',
                    ], 422);
                }
            }
            $user->is_active = $newActive;
        }
        $user->save();
        $user->load('department');
        $roleMap = ['admin' => 'Администратор', 'editor' => 'Редактор', 'user' => 'Пользователь'];
        return response()->json([
            'user_id' => $user->id,
            'id' => $user->id,
            'email' => $user->email,
            'fullName' => $user->full_name,
            'name' => $user->full_name,
            'role' => $roleMap[$user->role] ?? $user->role,
            'position' => $user->position ?? '',
            'phone' => $user->phone ?? '',
            'department' => $user->department?->name ?? '',
            'department_id' => $user->department_id,
            'is_active' => $user->is_active,
        ]);
    }

    public function destroyUser(Request $request, int $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['error' => 'Доступ запрещён.', 'message' => 'Доступ запрещён.'], 403);
        }
        if ((int) $request->user()->id === (int) $id) {
            return response()->json(['error' => 'Нельзя удалить самого себя.', 'message' => 'Нельзя удалить самого себя.'], 422);
        }
        $user = User::find($id);
        if (!$user) {
            return response()->json(['error' => 'Не найдено.', 'message' => 'Не найдено.'], 404);
        }
        if ($user->role === 'admin') {
            $adminsCount = User::where('role', 'admin')->count();
            if ($adminsCount <= 1) {
                return response()->json([
                    'error' => 'Нельзя удалить последнего администратора. В системе должен остаться хотя бы один.',
                    'message' => 'Нельзя удалить последнего администратора. В системе должен остаться хотя бы один.',
                ], 422);
            }
        }
        $user->delete();
        return response()->json(null, 204);
    }
}
