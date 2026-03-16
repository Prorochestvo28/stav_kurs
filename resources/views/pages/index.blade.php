@extends('layouts.app')

@section('title', 'Главная')

@section('search')
@endsection

@section('content')
<div class="main-content">
    <aside class="sidebar">
        <div class="sidebar-section">
            <h3>Фильтры</h3>
            <ul class="filter-options">
                <li><a href="#" class="filter-link active" data-filter-type="status" data-filter-value="all">Все документы <span class="filter-count" data-filter-key="all">0</span></a></li>
                <li><a href="#" class="filter-link" data-filter-type="status" data-filter-value="draft">Черновики <span class="filter-count" data-filter-key="draft">0</span></a></li>
                <li><a href="#" class="filter-link" data-filter-type="status" data-filter-value="review">На согласовании <span class="filter-count" data-filter-key="review">0</span></a></li>
                <li><a href="#" class="filter-link" data-filter-type="status" data-filter-value="approved">Согласованные <span class="filter-count" data-filter-key="approved">0</span></a></li>
                <li><a href="#" class="filter-link" data-filter-type="status" data-filter-value="rejected">Архивные <span class="filter-count" data-filter-key="rejected">0</span></a></li>
            </ul>
        </div>
        <div class="sidebar-section">
            <h3>Категории</h3>
            <ul class="filter-options">
                <li><a href="#" class="filter-link active" data-filter-type="category" data-filter-value="all">Все категории <span class="filter-count" data-filter-key="category_all">0</span></a></li>
                <li><a href="#" class="filter-link" data-filter-type="category" data-filter-value="Технические">Технические <span class="filter-count" data-filter-key="Технические">0</span></a></li>
                <li><a href="#" class="filter-link" data-filter-type="category" data-filter-value="Коммерческие">Коммерческие <span class="filter-count" data-filter-key="Коммерческие">0</span></a></li>
                <li><a href="#" class="filter-link" data-filter-type="category" data-filter-value="Проектные">Проектные <span class="filter-count" data-filter-key="Проектные">0</span></a></li>
                <li><a href="#" class="filter-link" data-filter-type="category" data-filter-value="Отчетные">Отчетные <span class="filter-count" data-filter-key="Отчетные">0</span></a></li>
                <li><a href="#" class="filter-link" data-filter-type="category" data-filter-value="Прочие">Прочие <span class="filter-count" data-filter-key="Прочие">0</span></a></li>
            </ul>
        </div>
    </aside>
    <main class="content">
        <div class="dashboard-section">
            <div class="section-header">
                <h2 class="section-title">Мои задачи согласования</h2>
                <div class="section-actions">
                    <a href="{{ url('/approvals') }}">Все задачи →</a>
                </div>
            </div>
            <ul class="task-list"></ul>
        </div>
        <div class="dashboard-section">
            <div class="section-header">
                <h2 class="section-title">Недавние документы</h2>
                <div class="section-actions">
                    <a href="{{ url('/documents') }}">Все документы →</a>
                </div>
            </div>
            <ul class="document-list"></ul>
        </div>
    </main>
</div>
@push('scripts')
<script>
window.APP_URL = '{{ url("/") }}';
window.LOGIN_URL = '{{ url("/login") }}';
</script>
<script src="{{ asset('script/script.js') }}"></script>
<script src="{{ asset('script/api.js') }}"></script>
<script src="{{ asset('script/auth.js') }}"></script>
<script src="{{ asset('script/user-info.js') }}"></script>
<script src="{{ asset('script/access-control.js') }}"></script>
<script src="{{ asset('script/documents.js') }}"></script>
<script src="{{ asset('script/approvals.js') }}"></script>
<script src="{{ asset('script/index-page.js') }}"></script>
@endpush
@endsection
