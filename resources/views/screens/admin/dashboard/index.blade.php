@extends('layouts.admin.master')

@section('title', 'Dashboard')
@section('page_title', 'Dashboard')
@section('page_breadcrumb', 'Admin / Overview')
@section('page_subtitle', 'School overview and daily activity')

@section('content')
<section class="pos-kpi-grid pos-stagger">
    <article class="pos-kpi pos-stat-card">
        <div>
            <p class="pos-kpi-label">Students</p>
            <h3 class="pos-kpi-value">0</h3>
            <p class="pos-kpi-hint">Total enrolled</p>
        </div>
        <div class="pos-kpi-icon teal"><i class="fa-solid fa-user-graduate"></i></div>
    </article>

    <article class="pos-kpi pos-stat-card">
        <div>
            <p class="pos-kpi-label">Teachers</p>
            <h3 class="pos-kpi-value">0</h3>
            <p class="pos-kpi-hint">Active staff</p>
        </div>
        <div class="pos-kpi-icon teal"><i class="fa-solid fa-chalkboard-user"></i></div>
    </article>

    <article class="pos-kpi pos-stat-card">
        <div>
            <p class="pos-kpi-label">Classes</p>
            <h3 class="pos-kpi-value">0</h3>
            <p class="pos-kpi-hint">Active sections</p>
        </div>
        <div class="pos-kpi-icon teal"><i class="fa-solid fa-school"></i></div>
    </article>

    <article class="pos-kpi pos-stat-card">
        <div>
            <p class="pos-kpi-label">Attendance today</p>
            <h3 class="pos-kpi-value">0%</h3>
            <p class="pos-kpi-hint">Present rate</p>
        </div>
        <div class="pos-kpi-icon teal"><i class="fa-solid fa-clipboard-check"></i></div>
    </article>
</section>

<section class="pos-stagger pos-stagger-late" style="margin-top: 1rem;">
    <article class="pos-panel school-dash-hero">
        <div class="school-dash-hero__main">
            <p class="school-dash-hero__eyebrow"><span></span> Campus live</p>
            <h3>Welcome, {{ auth()->user()->name }}</h3>
            <p>
                Your admin workspace is ready. Manage students, teachers, classes, and attendance
                from one place as we continue building the next modules.
            </p>
        </div>

        <div class="school-dash-hero__side">
            <div class="school-dash-chip">
                <i class="fa-solid fa-graduation-cap"></i>
                <div>
                    <strong>Academics</strong>
                    <span>Classes & curriculum</span>
                </div>
            </div>
            <div class="school-dash-chip">
                <i class="fa-solid fa-user-doctor"></i>
                <div>
                    <strong>Staff</strong>
                    <span>Teachers & roles</span>
                </div>
            </div>
            <div class="school-dash-chip">
                <i class="fa-solid fa-rocket"></i>
                <div>
                    <strong>Growth</strong>
                    <span>STEM-ready campus</span>
                </div>
            </div>
        </div>
    </article>
</section>
@endsection
