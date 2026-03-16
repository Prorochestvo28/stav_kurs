<?php

use App\Http\Controllers\Api\ApprovalController;
use App\Http\Controllers\Api\DataController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Auth\LoginController;
use Illuminate\Support\Facades\Route;

Route::get('/login', [LoginController::class, 'showLoginForm'])->name('login');
Route::get('/login.html', fn () => redirect()->route('login')); // обратная совместимость
Route::post('/login', [LoginController::class, 'login']);
Route::post('/logout', [LoginController::class, 'logout'])->name('logout');

Route::middleware('auth')->group(function () {
    Route::get('/', fn () => view('pages.index'))->name('home');
    Route::get('/documents', fn () => view('pages.documents'));
    Route::get('/documents/{id}', fn ($id) => view('pages.document-detail', ['documentId' => $id]));
    Route::get('/approvals', fn () => view('pages.approvals'));
    Route::get('/approvals/{id}', fn ($id) => view('pages.approval-detail', ['approvalId' => $id]));
    Route::get('/reports', fn () => view('pages.reports'));
    Route::get('/settings', fn () => view('pages.settings'));
    Route::get('/profile', fn () => view('pages.profile'));

    // API (JSON) — сессия та же
    Route::prefix('api')->group(function () {
        Route::get('/user', [DataController::class, 'user']);
        Route::get('/user/activity', [DataController::class, 'activity']);
        Route::put('/user', [DataController::class, 'updateUser']);
        Route::get('/departments', [DataController::class, 'departments']);
        Route::post('/departments', [DataController::class, 'storeDepartment']);
        Route::put('/departments/{id}', [DataController::class, 'updateDepartment']);
        Route::delete('/departments/{id}', [DataController::class, 'destroyDepartment']);
        Route::get('/document-types', [DataController::class, 'documentTypes']);
        Route::get('/categories', [DataController::class, 'categories']);
        Route::post('/categories', [DataController::class, 'storeCategory']);
        Route::put('/categories/{id}', [DataController::class, 'updateCategory']);
        Route::delete('/categories/{id}', [DataController::class, 'destroyCategory']);
        Route::get('/users', [DataController::class, 'users']);
        Route::post('/users', [DataController::class, 'storeUser']);
        Route::put('/users/{id}', [DataController::class, 'updateUserById']);
        Route::delete('/users/{id}', [DataController::class, 'destroyUser']);

        Route::get('/documents', [DocumentController::class, 'index']);
        Route::get('/documents/stats', [DocumentController::class, 'stats']);
        Route::get('/documents/{id}/file', [DocumentController::class, 'download']);
        Route::get('/documents/{id}/versions/{versionId}/file', [DocumentController::class, 'downloadVersion']);
        Route::get('/documents/{id}/versions', [DocumentController::class, 'versions']);
        Route::get('/documents/{id}', [DocumentController::class, 'show']);
        Route::post('/documents', [DocumentController::class, 'store']);
        Route::post('/documents/{id}/update', [DocumentController::class, 'update']);
        Route::put('/documents/{id}', [DocumentController::class, 'update']);
        Route::delete('/documents/{id}', [DocumentController::class, 'destroy']);

        Route::get('/approvals', [ApprovalController::class, 'index']);
        Route::get('/approvals/my', [ApprovalController::class, 'myApprovals']);
        Route::get('/approvals/{id}', [ApprovalController::class, 'show']);
        Route::post('/approvals', [ApprovalController::class, 'store']);
        Route::post('/approvals/{approvalId}/steps/{stepId}/approve', [ApprovalController::class, 'approveStep']);
        Route::post('/approvals/{approvalId}/steps/{stepId}/reject', [ApprovalController::class, 'rejectStep']);
    });
});
