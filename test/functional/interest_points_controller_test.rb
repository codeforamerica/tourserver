require 'test_helper'

class InterestPointsControllerTest < ActionController::TestCase
  setup do
    @interest_point = interest_points(:one)
  end

  test "should get index" do
    get :index
    assert_response :success
    assert_not_nil assigns(:interest_points)
  end

  test "should get new" do
    get :new
    assert_response :success
  end

  test "should create interest_point" do
    assert_difference('InterestPoint.count') do
      post :create, interest_point: { location: @interest_point.location, name: @interest_point.name }
    end

    assert_redirected_to interest_point_path(assigns(:interest_point))
  end

  test "should show interest_point" do
    get :show, id: @interest_point
    assert_response :success
  end

  test "should get edit" do
    get :edit, id: @interest_point
    assert_response :success
  end

  test "should update interest_point" do
    put :update, id: @interest_point, interest_point: { location: @interest_point.location, name: @interest_point.name }
    assert_redirected_to interest_point_path(assigns(:interest_point))
  end

  test "should destroy interest_point" do
    assert_difference('InterestPoint.count', -1) do
      delete :destroy, id: @interest_point
    end

    assert_redirected_to interest_points_path
  end
end
