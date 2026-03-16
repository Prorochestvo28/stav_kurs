@extends('layouts.app')

@section('title', 'Согласование — комментарии')

@section('content')
<div class="main-content">
    <div class="content">
        <div class="section-header" style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
            <a href="{{ url('/approvals') }}" class="btn btn-secondary" style="text-decoration: none;">← К списку согласований</a>
            <h2 class="section-title" style="margin: 0;">Комментарии по согласованию</h2>
        </div>
        <div id="approvalDetailLoading" class="approval-detail-loading">Загрузка...</div>
        <div id="approvalDetailError" class="approval-detail-error" style="display: none;"></div>
        <div id="approvalDetailContent" style="display: none;">
            <div class="approval-detail-header">
                <div id="approvalDetailTitle" class="approval-detail-title"></div>
                <div id="approvalDetailMeta" class="approval-detail-meta"></div>
                <div style="margin-top: 12px;">
                    <a id="approvalDetailDownload" href="#" class="btn btn-download" style="display: inline-block; text-decoration: none;">Скачать документ</a>
                </div>
            </div>
            <h3 style="margin-bottom: 16px;">Ход согласования</h3>
            <div id="approvalDetailSteps" class="approval-detail-steps"></div>
        </div>
    </div>
</div>
@push('scripts')
<script>window.APP_URL = '{{ url("/") }}'; window.LOGIN_URL = '{{ url("/login") }}'; window.APPROVAL_ID = {{ (int) $approvalId }};</script>
<script src="{{ asset('script/script.js') }}"></script>
<script src="{{ asset('script/api.js') }}"></script>
<script src="{{ asset('script/auth.js') }}"></script>
<script src="{{ asset('script/user-info.js') }}"></script>
<script src="{{ asset('script/access-control.js') }}"></script>
<script src="{{ asset('script/documents.js') }}"></script>
<script src="{{ asset('script/approvals.js') }}"></script>
<script src="{{ asset('script/approval-detail.js') }}"></script>
@endpush
@endsection
