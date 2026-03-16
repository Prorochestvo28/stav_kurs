@extends('layouts.app')

@section('title', 'Согласования')

@section('content')
<div class="main-content">
    <div class="content">
        <div class="section-header">
            <h2 class="section-title">Согласования</h2>
        </div>
        <div class="tabs">
            <div class="tab active" data-tab="my-approvals">Мои согласования</div>
            <div class="tab" data-tab="initiated">Инициированные мной</div>
            <div class="tab" data-tab="completed">Завершенные</div>
        </div>
        <div class="tab-content active" id="my-approvals">
            <div class="approval-grid"></div>
            <ul class="pagination" id="myApprovalsPagination"></ul>
        </div>
        <div class="tab-content" id="initiated">
            <div class="approval-grid"></div>
            <ul class="pagination" id="initiatedApprovalsPagination"></ul>
        </div>
        <div class="tab-content" id="completed">
            <div class="approval-grid"></div>
            <ul class="pagination" id="completedApprovalsPagination"></ul>
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
<script src="{{ asset('script/approvals-page.js') }}"></script>
@endpush
@endsection
