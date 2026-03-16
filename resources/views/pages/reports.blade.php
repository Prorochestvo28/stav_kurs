@extends('layouts.app')

@section('title', 'Отчеты')

@section('content')
<div class="main-content">
    <div class="content">
        <div class="section-header">
            <h2 class="section-title">Отчеты</h2>
        </div>
        <div class="report-filters">
            <div class="filter-group">
                <label for="reportPeriodPreset">Период</label>
                <select id="reportPeriodPreset" class="form-control">
                    <option value="last30">Последние 30 дней</option>
                    <option value="last7">Последние 7 дней</option>
                    <option value="custom">Произвольный диапазон</option>
                </select>
            </div>
            <div class="filter-group report-filter-dates" id="reportCustomDates">
                <label>Диапазон дат</label>
                <div class="report-filter-dates-inner">
                    <input type="date" class="form-control" id="reportStartDate">
                    <span>—</span>
                    <input type="date" class="form-control" id="reportEndDate">
                </div>
            </div>
            <button type="button" class="btn btn-secondary" id="applyReportPeriod">Применить</button>
        </div>
        <div class="quick-stats">
            <div class="stat-card"><div class="value" id="reportsStatTotalDocs">0</div><div class="label">Всего документов</div></div>
            <div class="stat-card"><div class="value" id="reportsStatReview">0</div><div class="label">На согласовании</div></div>
            <div class="stat-card"><div class="value" id="reportsStatApproved">0</div><div class="label">Согласовано</div></div>
            <div class="stat-card"><div class="value" id="reportsStatOverdue">0</div><div class="label">Просрочено</div></div>
        </div>
        <div class="tabs">
            <div class="tab active" data-tab="standard-reports">Стандартные отчеты</div>
            <div class="tab" data-tab="scheduled-reports">Запланированные</div>
            <div class="tab" data-tab="archive-reports">Архив отчетов</div>
        </div>
        <div class="tab-content active" id="standard-reports">
            <div class="report-grid">
                <div class="report-card">
                    <div class="report-header">
                        <div><div class="report-title">Отчет по документообороту</div><div class="report-meta">Общий отчет по движению документов</div></div>
                        <div class="report-type">Общий</div>
                    </div>
                    <div class="report-stats">
                        <div class="stat"><div class="stat-value" id="reportDocsTotal">0</div><div class="stat-label">Документов</div></div>
                        <div class="stat"><div class="stat-value" id="reportDocsApproved">0</div><div class="stat-label">Согласовано</div></div>
                        <div class="stat"><div class="stat-value" id="reportDocsReview">0</div><div class="stat-label">В работе</div></div>
                    </div>
                    <div class="report-period"><strong>Период:</strong> <span id="reportDocsPeriod">—</span></div>
                    <div class="report-description">Полный отчет по движению документов в системе.</div>
                    <div class="report-actions"><button class="btn btn-generate" data-report-type="documents">Сформировать отчет</button></div>
                </div>
                <div class="report-card">
                    <div class="report-header">
                        <div><div class="report-title">Отчет по согласованиям</div><div class="report-meta">Статистика процессов согласования</div></div>
                        <div class="report-type">Аналитика</div>
                    </div>
                    <div class="report-stats">
                        <div class="stat"><div class="stat-value" id="reportApprovalsActive">0</div><div class="stat-label">Активных</div></div>
                        <div class="stat"><div class="stat-value" id="reportApprovalsAvg">0</div><div class="stat-label">Дней среднее</div></div>
                        <div class="stat"><div class="stat-value" id="reportApprovalsOverdue">0%</div><div class="stat-label">Просрочено</div></div>
                    </div>
                    <div class="report-period"><strong>Период:</strong> <span id="reportApprovalsPeriod">—</span></div>
                    <div class="report-description">Детальная аналитика процессов согласования.</div>
                    <div class="report-actions"><button class="btn btn-generate" data-report-type="approvals">Сформировать отчет</button></div>
                </div>
                <div class="report-card">
                    <div class="report-header">
                        <div><div class="report-title">Отчет по проектам</div><div class="report-meta">Документация по проектам</div></div>
                        <div class="report-type">Проектный</div>
                    </div>
                    <div class="report-stats">
                        <div class="stat"><div class="stat-value" id="reportProjectsCount">0</div><div class="stat-label">Проекта</div></div>
                        <div class="stat"><div class="stat-value" id="reportProjectsDocs">0</div><div class="stat-label">Документов</div></div>
                        <div class="stat"><div class="stat-value" id="reportProjectsProgress">0%</div><div class="stat-label">Готовность</div></div>
                    </div>
                    <div class="report-period"><strong>Период:</strong> <span id="reportProjectsPeriod">—</span></div>
                    <div class="report-description">Отчет по документационному обеспечению проектов.</div>
                    <div class="report-actions"><button class="btn btn-generate" data-report-type="projects">Сформировать отчет</button></div>
                </div>
            </div>
        </div>
        <div class="tab-content" id="scheduled-reports">
            <div class="report-grid">
                <div class="report-card">
                    <div class="report-header">
                        <div><div class="report-title">Еженедельный отчет по документообороту</div><div class="report-meta">Автоматически формируется каждый понедельник</div></div>
                        <div class="report-type">По расписанию</div>
                    </div>
                    <div class="report-period"><strong>Расписание:</strong> Каждый понедельник, 09:00</div>
                    <div class="report-actions"><button class="btn btn-download" data-scheduled="weekly-docs">Скачать</button></div>
                </div>
                <div class="report-card">
                    <div class="report-header">
                        <div><div class="report-title">Месячный отчет по согласованиям</div><div class="report-meta">Формируется 1 числа каждого месяца</div></div>
                        <div class="report-type">По расписанию</div>
                    </div>
                    <div class="report-period"><strong>Расписание:</strong> 1 число каждого месяца, 10:00</div>
                    <div class="report-actions"><button class="btn btn-download" data-scheduled="monthly-approvals">Скачать</button></div>
                </div>
            </div>
        </div>
        <div class="tab-content" id="archive-reports">
            <div class="report-grid" id="reportsArchiveList"></div>
            <div class="empty-state" id="reportsArchiveEmpty">Еще не сформировано ни одного отчета.</div>
            <ul class="pagination" id="reportsArchivePagination"></ul>
        </div>
    </div>
</div>
@push('scripts')
<script>window.APP_URL = '{{ url("/") }}'; window.LOGIN_URL = '{{ url("/login") }}';</script>
<script src="{{ asset('script/script.js') }}"></script>
<script src="{{ asset('script/api.js') }}"></script>
<script src="{{ asset('script/auth.js') }}"></script>
<script src="{{ asset('script/user-info.js') }}"></script>
<script src="{{ asset('script/access-control.js') }}"></script>
<script src="{{ asset('script/documents.js') }}"></script>
<script src="{{ asset('script/approvals.js') }}"></script>
<script src="{{ asset('script/modals.js') }}"></script>
<script src="{{ asset('script/reports-page.js') }}"></script>
@endpush
@endsection
