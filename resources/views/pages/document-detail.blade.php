@extends('layouts.app')

@section('title', 'Документ')

@section('content')
<div class="main-content">
    <div class="content">
        <div class="section-header" style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
            <a href="{{ url('/documents') }}" class="btn btn-secondary" style="text-decoration: none;">← К списку документов</a>
            <h2 class="section-title" style="margin: 0;">Документ</h2>
        </div>
        <div id="documentDetailLoading" class="document-detail-loading">Загрузка...</div>
        <div id="documentDetailError" class="document-detail-error" style="display: none;"></div>
        <div id="documentDetailContent" style="display: none;">
            <div class="document-detail-header">
                <h3 id="documentDetailTitle" class="document-detail-title"></h3>
                <div id="documentDetailMeta" class="document-detail-meta"></div>
                <div id="documentDetailDescription" class="document-detail-description"></div>
                <div style="margin-top: 16px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <a id="documentDetailDownload" href="#" class="btn btn-primary" style="text-decoration: none;">Скачать текущую версию</a>
                    <span id="documentDetailActions"></span>
                </div>
            </div>
            <h3 style="margin-bottom: 16px;">История версий</h3>
            <div id="documentDetailVersions" class="document-detail-versions"></div>
        </div>
    </div>
</div>
@push('scripts')
<script>window.APP_URL = '{{ url("/") }}'; window.LOGIN_URL = '{{ url("/login") }}'; window.DOCUMENT_ID = {{ (int) $documentId }};</script>
<script src="{{ asset('script/script.js') }}"></script>
<script src="{{ asset('script/api.js') }}"></script>
<script src="{{ asset('script/auth.js') }}"></script>
<script src="{{ asset('script/user-info.js') }}"></script>
<script src="{{ asset('script/access-control.js') }}"></script>
<script src="{{ asset('script/documents.js') }}"></script>
<script src="{{ asset('script/document-detail.js') }}"></script>
@endpush
@endsection
